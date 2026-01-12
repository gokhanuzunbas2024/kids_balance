import React, { useState, useEffect } from 'react';
import { ActivityLogger } from './components/ActivityLogger/ActivityLogger';
import { BalanceDashboard } from './components/Dashboard/BalanceDashboard';
import { ParentDashboard } from './components/Parent/ParentDashboard';
import { WelcomePage } from './components/Welcome/WelcomePage';
import { seedDatabase } from '@/db/seedData';
import { db } from '@/db/schema';
import { useSettingsStore } from './stores/settingsStore';
import { Home, BarChart3, Settings } from 'lucide-react';

type View = 'logger' | 'dashboard' | 'parent';

function App() {
  const [currentView, setCurrentView] = useState<View>('logger');
  const { loadSettings, isLoading: settingsLoading, hasChildName } = useSettingsStore();

  // Use a ref to prevent double initialization in React StrictMode
  const initRef = React.useRef(false);
  
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initRef.current) {
      console.log('⏭️ Skipping duplicate initialization (React StrictMode)');
      return;
    }
    initRef.current = true;
    
    // Seed database with preset activities on first load, then load users
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // Check if IndexedDB is available
        if (!window.indexedDB) {
          throw new Error('IndexedDB is not available in this browser');
        }
        console.log('✅ IndexedDB is available');
        
        // Check if database is already open
        if (db.isOpen()) {
          console.log('✅ Database already open');
        } else {
          console.log('🚀 Opening database...');
          console.log('📊 Database name:', db.name);
          console.log('📊 Database version:', db.verno);
          
          // Try to open database with comprehensive error handling
          console.log('🔄 Attempting to open database with detailed error handling...');
          
          // First, check what version the database is at (if it exists)
          let existingVersion = 0;
          try {
            const checkRequest = indexedDB.open('ActivityTrackerDB');
            await new Promise<void>((resolve, reject) => {
              checkRequest.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                existingVersion = db.version;
                console.log(`📊 Existing database version: ${existingVersion}`);
                db.close();
                resolve();
              };
              checkRequest.onerror = () => {
                console.log('ℹ️ Database does not exist yet');
                resolve(); // Not an error if it doesn't exist
              };
              checkRequest.onupgradeneeded = () => {
                // This won't fire if we're just checking
                resolve();
              };
              setTimeout(() => resolve(), 1000); // Timeout after 1 second
            });
          } catch (checkError) {
            console.log('ℹ️ Could not check database version:', checkError);
          }
          
          // If database exists with a different version, delete it and start fresh
          if (existingVersion > 1) {
            console.warn(`⚠️ Database exists at version ${existingVersion}, but we need version 1. Deleting old database...`);
            try {
              const deleteReq = indexedDB.deleteDatabase('ActivityTrackerDB');
              await new Promise<void>((resolve) => {
                const timeout = setTimeout(() => {
                  console.warn('⚠️ Delete timeout, continuing...');
                  resolve();
                }, 3000);
                
                deleteReq.onsuccess = () => {
                  clearTimeout(timeout);
                  console.log('🗑️ Deleted old database');
                  resolve();
                };
                deleteReq.onerror = () => {
                  clearTimeout(timeout);
                  console.warn('⚠️ Could not delete database');
                  resolve();
                };
                deleteReq.onblocked = () => {
                  console.warn('⚠️ Delete blocked - close other tabs');
                  clearTimeout(timeout);
                  setTimeout(() => resolve(), 2000);
                };
              });
              
              // Wait a moment for cleanup
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (deleteError) {
              console.error('❌ Error deleting old database:', deleteError);
            }
          }
          
          // First, try using native IndexedDB to get detailed error information
          try {
            const nativeOpenResult = await new Promise<IDBDatabase>((resolve, reject) => {
              const request = indexedDB.open('ActivityTrackerDB', 1);
              let errorDetails: any = null;
              let resolved = false;
              
              // Timeout after 10 seconds
              const timeoutId = setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  reject(new Error('IndexedDB open request timed out after 10 seconds'));
                }
              }, 10000);
              
              const clearTimeoutAndResolve = (db: IDBDatabase) => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timeoutId);
                  console.log('✅ Native IndexedDB opened successfully');
                  db.close(); // Close it so Dexie can open it
                  resolve(db);
                }
              };
              
              const clearTimeoutAndReject = (error: Error) => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timeoutId);
                  reject(error);
                }
              };
              
              request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                clearTimeoutAndResolve(db);
              };
              
              request.onerror = (event) => {
                const target = event.target as IDBOpenDBRequest;
                errorDetails = {
                  error: target.error,
                  errorName: target.error?.name,
                  errorMessage: target.error?.message,
                  errorCode: target.error?.code,
                };
                console.error('❌ Native IndexedDB error event:', errorDetails);
                
                // Check if it's a version error - database exists with higher version
                if (target.error?.message?.includes('version') || target.error?.name === 'VersionError') {
                  console.warn('⚠️ Version mismatch detected - will delete and recreate database');
                  // Don't reject here - we'll handle it by deleting the database
                  errorDetails.versionMismatch = true;
                }
                
                clearTimeoutAndReject(new Error(`IndexedDB error: ${target.error?.name || 'Unknown'} - ${target.error?.message || 'No details'}`));
              };
              
              request.onblocked = (event) => {
                console.warn('⚠️ IndexedDB blocked - database is open in another tab/window');
                errorDetails = { blocked: true };
                // Don't reject - just warn, it might resolve
              };
              
              request.onupgradeneeded = (event) => {
                console.log('🔄 IndexedDB upgrade needed');
                const db = (event.target as IDBOpenDBRequest).result;
                // Let Dexie handle the upgrade, but we can create basic structure if needed
              };
            });
            
            console.log('✅ Native IndexedDB test passed, now opening with Dexie...');
          } catch (nativeError) {
            console.error('❌ Native IndexedDB test failed:', nativeError);
            
            // Inspect the error in detail
            const errorInfo: any = {
              message: nativeError instanceof Error ? nativeError.message : String(nativeError),
              name: nativeError instanceof Error ? nativeError.name : 'Unknown',
              stack: nativeError instanceof Error ? nativeError.stack : undefined,
            };
            
            // Check if it's a DOMException (IndexedDB errors usually are)
            if (nativeError instanceof DOMException) {
              errorInfo.domException = {
                name: nativeError.name,
                code: nativeError.code,
                message: nativeError.message,
              };
              
              // Map error codes to human-readable messages
              const errorCodeMap: Record<number, string> = {
                1: 'INDEX_SIZE_ERR',
                2: 'DOMSTRING_SIZE_ERR',
                3: 'HIERARCHY_REQUEST_ERR',
                4: 'WRONG_DOCUMENT_ERR',
                5: 'INVALID_CHARACTER_ERR',
                6: 'NO_DATA_ALLOWED_ERR',
                7: 'NO_MODIFICATION_ALLOWED_ERR',
                8: 'NOT_FOUND_ERR',
                9: 'NOT_SUPPORTED_ERR',
                10: 'INUSE_ATTRIBUTE_ERR',
                11: 'INVALID_STATE_ERR',
                12: 'SYNTAX_ERR',
                13: 'INVALID_MODIFICATION_ERR',
                14: 'NAMESPACE_ERR',
                15: 'INVALID_ACCESS_ERR',
                16: 'VALIDATION_ERR',
                17: 'TYPE_MISMATCH_ERR',
                18: 'SECURITY_ERR',
                19: 'NETWORK_ERR',
                20: 'ABORT_ERR',
                21: 'URL_MISMATCH_ERR',
                22: 'QUOTA_EXCEEDED_ERR',
                23: 'TIMEOUT_ERR',
                24: 'INVALID_NODE_TYPE_ERR',
                25: 'DATA_CLONE_ERR',
              };
              
              errorInfo.errorCodeName = errorCodeMap[nativeError.code] || `UNKNOWN_CODE_${nativeError.code}`;
            }
            
            console.error('📊 Detailed error information:', errorInfo);
            
            // Provide specific error-based troubleshooting
            let helpMsg = `IndexedDB Error Details:\n\n`;
            helpMsg += `Error: ${errorInfo.message}\n`;
            if (errorInfo.domException) {
              helpMsg += `Type: ${errorInfo.domException.name}\n`;
              helpMsg += `Code: ${errorInfo.domException.code} (${errorInfo.errorCodeName || 'Unknown'})\n`;
            }
            
            helpMsg += `\nTroubleshooting:\n\n`;
            
            if (errorInfo.errorCodeName === 'SECURITY_ERR' || errorInfo.message.includes('security')) {
              helpMsg += `🔒 Security Error:\n`;
              helpMsg += `- Check chrome://settings/content/all\n`;
              helpMsg += `- Allow "Storage" for localhost\n`;
              helpMsg += `- Disable privacy/security extensions\n`;
            } else if (errorInfo.errorCodeName === 'QUOTA_EXCEEDED_ERR') {
              helpMsg += `💾 Quota Exceeded:\n`;
              helpMsg += `- Clear browser storage\n`;
              helpMsg += `- chrome://settings/clearBrowserData\n`;
            } else if (errorInfo.message.includes('timeout')) {
              helpMsg += `⏱️ Timeout Error:\n`;
              helpMsg += `- IndexedDB may be blocked\n`;
              helpMsg += `- Try: indexedDB.databases() in console\n`;
              helpMsg += `- Disable extensions\n`;
              helpMsg += `- Try Guest mode\n`;
            } else {
              helpMsg += `- Check chrome://settings/content/all\n`;
              helpMsg += `- Disable extensions\n`;
              helpMsg += `- Try Guest mode\n`;
              helpMsg += `- Check chrome://flags (search "IndexedDB")\n`;
            }
            
            console.error('💡', helpMsg);
            alert(helpMsg);
            throw nativeError;
          }
          
          // Now try to open with Dexie
          try {
            console.log('🔄 Opening with Dexie...');
            await Promise.race([
              db.open(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Dexie open timeout after 5 seconds')), 5000)
              )
            ]);
            console.log('✅ Database opened successfully with Dexie');
            console.log('📊 Database is now open:', db.isOpen());
          } catch (dexieError) {
            console.error('❌ Dexie open failed:', dexieError);
            console.error('📊 Dexie error details:', {
              message: dexieError instanceof Error ? dexieError.message : String(dexieError),
              name: dexieError instanceof Error ? dexieError.name : 'Unknown',
              stack: dexieError instanceof Error ? dexieError.stack : undefined,
            });
            throw dexieError;
          }
        }
        
        // Seed activities
        await seedDatabase();
        console.log('✅ Database seeded');
        
        // Load settings
        await loadSettings();
        console.log('✅ Settings loaded');
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        } else {
          console.error('Error type:', typeof error);
          console.error('Error value:', error);
        }
        
        // Show helpful error message
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('💡 To fix: Open DevTools > Application > IndexedDB > Delete "ActivityTrackerDB" then refresh');
        alert(`Database error: ${errorMsg}\n\nPlease clear IndexedDB:\n1. Open DevTools (F12)\n2. Application tab > IndexedDB\n3. Delete "ActivityTrackerDB"\n4. Refresh page`);
      }
    };
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Show welcome page if no child name is set
  if (!settingsLoading && !hasChildName()) {
    return <WelcomePage />;
  }

  // Show loading state only during initial load
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="pb-20">
        {currentView === 'logger' && <ActivityLogger />}
        {currentView === 'dashboard' && <BalanceDashboard />}
        {currentView === 'parent' && <ParentDashboard />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto flex justify-around">
          <button
            onClick={() => setCurrentView('logger')}
            className={`flex flex-col items-center justify-center py-3 px-6 flex-1 transition-colors ${
              currentView === 'logger' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <Home size={24} />
            <span className="text-xs mt-1 font-semibold">Log</span>
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center justify-center py-3 px-6 flex-1 transition-colors ${
              currentView === 'dashboard' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <BarChart3 size={24} />
            <span className="text-xs mt-1 font-semibold">Dashboard</span>
          </button>
          <button
            onClick={() => setCurrentView('parent')}
            className={`flex flex-col items-center justify-center py-3 px-6 flex-1 transition-colors ${
              currentView === 'parent' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <Settings size={24} />
            <span className="text-xs mt-1 font-semibold">Parent</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
