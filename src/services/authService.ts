import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { getFirebaseAuth, getFirebaseDb, COLLECTIONS, setAuthPersistence } from '@/config/firebase';
import {
  LoginCredentials,
  RegisterCredentials,
  PinLoginCredentials,
  AddChildCredentials,
  PasswordResetRequest,
} from '@/types/auth';
import { User, CreateUserDTO, UserSettings } from '@/types';
import { Family, CreateFamilyDTO } from '@/types/family';
import { AUTH_CONFIG } from '@/config/constants';

class AuthService {
  private auth = getFirebaseAuth();
  private db = getFirebaseDb();

  // Hash PIN using PBKDF2
  private hashPin(pin: string, salt: string): string {
    return CryptoJS.PBKDF2(pin, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();
  }

  // Generate salt for PIN hashing
  private generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
  }

  // Register a new parent user
  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: credentials.displayName,
      });

      // Create family
      const familyId = uuidv4();
      const inviteCode = this.generateInviteCode();
      const family: Family = {
        id: familyId,
        name: credentials.familyName,
        ownerId: firebaseUser.uid,
        memberIds: [firebaseUser.uid],
        inviteCode,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        settings: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          weekStartsOn: 1, // Monday
          dailyGoalMinutes: 120,
          allowChildActivityCreation: false,
          requireParentApproval: true,
          maxScreenTimeMinutes: 120,
        },
      };

      await setDoc(doc(this.db, COLLECTIONS.FAMILIES, familyId), family);

      // Create user document
      const userData: CreateUserDTO = {
        email: credentials.email,
        displayName: credentials.displayName,
        role: 'parent',
        familyId,
      };

      const user: User = {
        id: firebaseUser.uid,
        ...userData,
        avatarUrl: null,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        lastLoginAt: null,
        settings: {
          theme: 'system',
          notifications: true,
          soundEffects: true,
          language: 'en',
        } as UserSettings,
      };

      await setDoc(doc(this.db, COLLECTIONS.USERS, firebaseUser.uid), user);

      // Seed default activities for the new family
      try {
        const { FirebaseActivityRepository } = await import('@/repositories/firebase/ActivityRepository');
        const activityRepo = new FirebaseActivityRepository();
        await activityRepo.seedDefaults(familyId, firebaseUser.uid);
        console.log('✅ Seeded default activities for new family');
      } catch (seedError) {
        console.warn('⚠️ Failed to seed default activities:', seedError);
        // Don't fail registration if seeding fails
      }

      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Login parent with email/password
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Set persistence
      if (credentials.rememberMe !== undefined) {
        await setAuthPersistence(credentials.rememberMe);
      }

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );
      const firebaseUser = userCredential.user;

      // Get user document
      let userDoc = await getDoc(doc(this.db, COLLECTIONS.USERS, firebaseUser.uid));
      
      // If user document doesn't exist, try to recover by checking for existing family
      if (!userDoc.exists()) {
        console.warn('⚠️ User document not found, attempting recovery...');
        
        // Check if user has a family (they might be the owner)
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const familiesQuery = query(
          collection(this.db, COLLECTIONS.FAMILIES),
          where('ownerId', '==', firebaseUser.uid)
        );
        const familiesSnapshot = await getDocs(familiesQuery);
        
        if (!familiesSnapshot.empty) {
          // Found a family - create the missing user document
          const family = familiesSnapshot.docs[0].data() as Family;
          const userData: CreateUserDTO = {
            email: firebaseUser.email || credentials.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'parent',
            familyId: family.id,
          };

          const newUser: User = {
            id: firebaseUser.uid,
            ...userData,
            avatarUrl: null,
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
            lastLoginAt: null,
            settings: {
              theme: 'system',
              notifications: true,
              soundEffects: true,
              language: 'en',
            } as UserSettings,
          };

          await setDoc(doc(this.db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
          console.log('✅ Recovered user document from existing family');
          
          userDoc = await getDoc(doc(this.db, COLLECTIONS.USERS, firebaseUser.uid));
        } else {
          // No family found - registration was incomplete
          console.error('❌ User document not found and no family exists');
          await signOut(this.auth);
          throw new Error(
            'Your account was not fully set up. Please register again to complete your account creation.'
          );
        }
      }

      const user = { id: userDoc.id, ...userDoc.data() } as User;
      
      // Verify user has required fields
      if (!user.familyId) {
        console.error('❌ User document exists but missing familyId');
        throw new Error(
          'Your account setup is incomplete. Please contact support or register again.'
        );
      }

      // Update last login
      await setDoc(
        doc(this.db, COLLECTIONS.USERS, firebaseUser.uid),
        {
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      return { ...user, lastLoginAt: serverTimestamp() as Timestamp };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Login child with PIN
  async loginChild(credentials: PinLoginCredentials): Promise<User> {
    try {
      // Query users by familyId and displayName
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const usersQuery = query(
        collection(this.db, COLLECTIONS.USERS),
        where('familyId', '==', credentials.familyId),
        where('displayName', '==', credentials.displayName),
        where('role', '==', 'child')
      );

      const snapshot = await getDocs(usersQuery);
      if (snapshot.empty) {
        throw new Error('Child not found');
      }

      const childDoc = snapshot.docs[0];
      const childData = childDoc.data() as User;

      if (!childData.pin) {
        throw new Error('PIN not set for this child');
      }

      // Verify PIN
      // PIN is stored as "hash:salt"
      const [storedHash, salt] = childData.pin.split(':');
      const inputHash = this.hashPin(credentials.pin, salt);

      if (inputHash !== storedHash) {
        throw new Error('Invalid PIN');
      }

      // Update last login
      await setDoc(
        doc(this.db, COLLECTIONS.USERS, childDoc.id),
        {
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      return { ...childData, id: childDoc.id, lastLoginAt: serverTimestamp() as Timestamp };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Add a child to the family
  async addChild(familyId: string, credentials: AddChildCredentials): Promise<User> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Verify user is parent in this family
      const userDoc = await getDoc(doc(this.db, COLLECTIONS.USERS, currentUser.uid));
      const userData = userDoc.data() as User;
      if (userData.role !== 'parent' || userData.familyId !== familyId) {
        throw new Error('Only parents can add children');
      }

      // Hash PIN
      const salt = this.generateSalt();
      const hashedPin = this.hashPin(credentials.pin, salt);
      const pinHash = `${hashedPin}:${salt}`;

      // Create child user (no Firebase Auth account)
      const childId = uuidv4();
      const child: User = {
        id: childId,
        email: null,
        displayName: credentials.displayName,
        avatarUrl: credentials.avatarUrl || null,
        role: 'child',
        familyId,
        pin: pinHash,
        dateOfBirth: credentials.dateOfBirth,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        lastLoginAt: null,
        settings: {
          theme: 'system',
          notifications: true,
          soundEffects: true,
          language: 'en',
        } as UserSettings,
      };

      await setDoc(doc(this.db, COLLECTIONS.USERS, childId), child);

      // Update family memberIds
      const familyDoc = await getDoc(doc(this.db, COLLECTIONS.FAMILIES, familyId));
      const familyData = familyDoc.data() as Family;
      await setDoc(
        doc(this.db, COLLECTIONS.FAMILIES, familyId),
        {
          memberIds: [...familyData.memberIds, childId],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return child;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Send password reset email
  async sendPasswordReset(request: PasswordResetRequest): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, request.email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return null;

    try {
      const userDoc = await getDoc(doc(this.db, COLLECTIONS.USERS, firebaseUser.uid));
      if (!userDoc.exists()) return null;

      return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseOnAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  // Generate invite code
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < AUTH_CONFIG.INVITE_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Handle Firebase auth errors
  private handleAuthError(error: any): Error {
    let message = 'An error occurred during authentication';
    let code = error.code || 'unknown';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/operation-not-allowed':
        message = 'This operation is not allowed';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/invalid-credential':
        message = 'Invalid email or password';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      default:
        message = error.message || message;
    }

    const authError = new Error(message);
    (authError as any).code = code;
    return authError;
  }
}

export const authService = new AuthService();
