import React, { useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { Modal } from './Modal';
import { Button } from './Button';
import { Users, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const UserSwitcher: React.FC = () => {
  const { users, currentUserId, createUser, setCurrentUser, deleteUser, loadUsers } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const currentUser = users.find(u => u.id === currentUserId);

  const handleAddUser = async () => {
    if (!newUserName.trim()) return;
    try {
      await createUser(newUserName.trim());
      setNewUserName('');
      setIsAddUserOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This will delete all their data.`)) {
      try {
        await deleteUser(userId);
        await loadUsers();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Cannot delete the current user');
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed top-4 right-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-30 border-2 border-gray-200"
        title="Switch user"
        aria-label="Switch user"
      >
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <span className="text-2xl">{currentUser.icon}</span>
              <span className="font-semibold text-sm hidden sm:inline">{currentUser.name}</span>
            </>
          ) : (
            <Users size={20} />
          )}
        </div>
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Switch User"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {users.map((user) => (
              <motion.button
                key={user.id}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  await setCurrentUser(user.id);
                  setIsModalOpen(false);
                }}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  user.id === currentUserId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{user.icon}</span>
                    <div>
                      <div className="font-bold">{user.name}</div>
                      {user.id === currentUserId && (
                        <div className="text-xs text-blue-600">Current</div>
                      )}
                    </div>
                  </div>
                  {users.length > 1 && user.id !== currentUserId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user.id, user.name);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Delete user"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          <Button
            onClick={() => {
              setIsAddUserOpen(true);
              setIsModalOpen(false);
            }}
            className="w-full"
          >
            <Plus size={18} className="inline mr-2" />
            Add New User
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isAddUserOpen}
        onClose={() => {
          setIsAddUserOpen(false);
          setNewUserName('');
        }}
        title="Add New User"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">User Name</label>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Enter name"
              className="w-full px-4 py-2 border rounded-lg"
              maxLength={20}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddUser();
                }
              }}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddUserOpen(false);
                setNewUserName('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!newUserName.trim()}
              className="flex-1"
            >
              Add User
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
