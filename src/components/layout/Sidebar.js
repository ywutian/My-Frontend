import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiGrid, 
  FiFileText, 
  FiFolder, 
  FiChevronDown, 
  FiChevronRight,
  FiSettings,
  FiChevronLeft,
  FiEdit2,
  FiTrash2,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import BillingModal from '../billing/BillingModal';
import SettingsModal from '../settings/SettingsModal';
import { folderService } from '../../services/folderService';
import ConfirmDialog from '../common/ConfirmDialog';

function Sidebar({ isOpen, onToggle }) {
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();
  const [showBilling, setShowBilling] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  const menuItems = [
    { id: 'dashboard', icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
    { id: 'notes', icon: FiFileText, label: 'All Notes', path: '/notes' },
  ];

  const [folders, setFolders] = useState([
    { id: 1, name: 'Study Notes', count: 5 },
    { id: 2, name: 'Work', count: 3 },
    { id: 3, name: 'Personal', count: 2 },
  ]);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await folderService.getFolders();
      setFolders(response);
    } catch (err) {
      setError('Failed to load folders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsClick = (e) => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const handleDashboardClick = () => {
    navigate('/');
  };

  const handleFolderClick = (folder, e) => {
    e.preventDefault();
    if (e.type === 'contextmenu') {
      e.preventDefault();
      setSelectedFolder(folder);
      setShowFolderMenu(true);
    } else {
      navigate(`/folders/${folder.id}`);
    }
  };

  const moveFolder = async (folderId, direction) => {
    try {
      await folderService.moveFolder(folderId, direction);
      await fetchFolders();
      setShowFolderMenu(false);
    } catch (err) {
      setError('Failed to move folder');
      console.error(err);
    }
  };

  const updateFolderName = async (folderId, newName) => {
    try {
      await folderService.updateFolder(folderId, { name: newName });
      await fetchFolders();
      setEditingFolder(null);
    } catch (err) {
      setError('Failed to update folder name');
      console.error(err);
    }
  };

  const handleDeleteClick = (folder) => {
    setFolderToDelete(folder);
    setShowDeleteConfirm(true);
    setShowFolderMenu(false);
  };

  const deleteFolder = async () => {
    if (!folderToDelete) return;
    
    try {
      await folderService.deleteFolder(folderToDelete.id);
      await fetchFolders();
      setShowDeleteConfirm(false);
      setFolderToDelete(null);
    } catch (err) {
      setError('Failed to delete folder');
      console.error(err);
    }
  };

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30
      ${isOpen ? 'w-64' : 'w-16'}
      transition-all duration-300
    `}>
      <div className={`
        h-full
        bg-white
        border-r
        flex
        flex-col
      `}>
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b cursor-pointer" onClick={handleDashboardClick}>
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Logo"
              className={`h-8 w-8 ${!isOpen ? 'mx-auto' : ''}`} 
            />
          </div>
        </div>

        {/* 折叠按钮 */}
        <button 
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border rounded-full flex items-center justify-center shadow-md hover:shadow-lg"
        >
          <FiChevronLeft 
            className={`w-4 h-4 transform transition-transform ${!isOpen && 'rotate-180'}`} 
          />
        </button>

        {/* Menu Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            {isOpen && <div className="text-xs font-semibold text-gray-400 mb-2">MENU</div>}
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  flex items-center px-2 py-2 mb-1 rounded-lg
                  ${location.pathname === item.path ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}
                  ${!isOpen && 'justify-center'}
                `}
              >
                <item.icon className={`h-5 w-5 ${isOpen && 'mr-3'}`} />
                {isOpen && <span>{item.label}</span>}
              </Link>
            ))}
          </div>

          {/* Folders Section */}
          <div className="px-4 py-4">
            {isOpen && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400">FOLDERS</span>
                <button 
                  onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isFoldersExpanded ? <FiChevronDown /> : <FiChevronRight />}
                </button>
              </div>
            )}
            
            {(isOpen && isFoldersExpanded) && folders.map((folder) => (
              <div key={folder.id}>
                <div
                  className={`
                    flex items-center justify-between px-2 py-2 rounded-lg 
                    hover:bg-gray-100 cursor-pointer
                    ${selectedFolder?.id === folder.id ? 'bg-gray-100' : ''}
                  `}
                  onClick={(e) => handleFolderClick(folder, e)}
                  onContextMenu={(e) => handleFolderClick(folder, e)}
                >
                  {editingFolder?.id === folder.id ? (
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 border rounded"
                      value={editingFolder.name}
                      onChange={(e) => setEditingFolder({...editingFolder, name: e.target.value})}
                      onBlur={() => updateFolderName(folder.id, editingFolder.name)}
                      onKeyPress={(e) => e.key === 'Enter' && updateFolderName(folder.id, editingFolder.name)}
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="flex items-center flex-1">
                        <FiFolder className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-600">{folder.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{folder.count}</span>
                    </>
                  )}
                </div>

                {/* Folder Context Menu */}
                {showFolderMenu && selectedFolder?.id === folder.id && (
                  <div className="absolute left-full ml-2 bg-white border rounded-lg shadow-lg p-2 z-30">
                    <button
                      onClick={() => moveFolder(folder.id, 'up')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center"
                    >
                      <FiArrowUp className="mr-2" /> Move Up
                    </button>
                    <button
                      onClick={() => moveFolder(folder.id, 'down')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center"
                    >
                      <FiArrowDown className="mr-2" /> Move Down
                    </button>
                    <button
                      onClick={() => {
                        setEditingFolder(folder);
                        setShowFolderMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center"
                    >
                      <FiEdit2 className="mr-2" /> Rename
                    </button>
                    <button
                      onClick={() => handleDeleteClick(folder)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center text-red-600"
                    >
                      <FiTrash2 className="mr-2" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Settings Section */}
        <div className="border-t p-4">
          <button 
            className={`
              flex items-center w-full px-2 py-2 rounded-lg
              text-gray-600 hover:bg-gray-100
              ${!isOpen && 'justify-center'}
            `}
            onClick={handleSettingsClick}
          >
            <FiSettings className={`h-5 w-5 ${isOpen && 'mr-3'}`} />
            {isOpen && <span>Settings</span>}
          </button>
        </div>

        {/* Settings Menu Dropdown */}
        {showSettingsMenu && (
          <div className="absolute bottom-16 left-0 w-full bg-white border rounded-lg shadow-lg p-2">
            <button
              onClick={() => {
                setShowSettings(true);
                setShowSettingsMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
            >
              Settings
            </button>
            <button
              onClick={() => {
                setShowBilling(true);
                setShowSettingsMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
            >
              Billing
            </button>
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded text-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <BillingModal 
        isOpen={showBilling}
        onClose={() => setShowBilling(false)}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteFolder}
        title="Delete Folder"
        message={`Are you sure you want to delete "${folderToDelete?.name}"? This action cannot be undone.`}
      />

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
        </div>
      )}
    </div>
  );
}

export default Sidebar; 