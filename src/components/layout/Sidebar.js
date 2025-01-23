import { useState, useEffect, useCallback, useRef } from 'react';
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
import { db } from '../../db/db';
import FolderSelector from '../Folder/FolderSelector';

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
  const [folders, setFolders] = useState([]);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const settingsMenuRef = useRef(null);
  const folderMenuRef = useRef(null);

  const menuItems = [
    { id: 'dashboard', icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
    { id: 'notes', icon: FiFileText, label: 'All Notes', path: '/notes' },
  ];

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      const dbFolders = await db.folders.toArray();
      
      const foldersWithCounts = await Promise.all(
        dbFolders.map(async (folder, index) => {
          const count = await db.notes
            .where('folderId')
            .equals(folder.id)
            .count();
          return { 
            ...folder, 
            count,
            position: folder.position ?? index 
          };
        })
      );
      
      const sortedFolders = foldersWithCounts.sort((a, b) => 
        (a.position ?? 0) - (b.position ?? 0)
      );
      
      setFolders(sortedFolders);
    } catch (err) {
      setError('Failed to load folders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [location.pathname, fetchFolders]);

  useEffect(() => {
    fetchFolders();
    
    const intervalId = setInterval(fetchFolders, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchFolders]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
      if (folderMenuRef.current && !folderMenuRef.current.contains(event.target)) {
        setShowFolderMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSettingsClick = (e) => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleFolderClick = (folder, e) => {
    if (e.type === 'contextmenu') {
      e.preventDefault();
      setSelectedFolder(folder);
      setShowFolderMenu(true);
    } else {
      console.log('Navigating to folder:', folder.id);
      navigate(`/folders/${folder.id}`);
    }
  };

  const moveFolder = async (folderId, direction) => {
    try {
      const allFolders = await db.folders.toArray();
      const currentIndex = allFolders.findIndex(f => f.id === folderId);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= allFolders.length) return;

      const folder1 = allFolders[currentIndex];
      const folder2 = allFolders[newIndex];
      
      const tempPosition = folder1.position || currentIndex;
      
      await db.folders.update(folder1.id, { 
        position: folder2.position || newIndex,
        lastModified: new Date().toISOString(),
        syncStatus: 'pending'
      });
      
      await db.folders.update(folder2.id, { 
        position: tempPosition,
        lastModified: new Date().toISOString(),
        syncStatus: 'pending'
      });

      await fetchFolders();
      setShowFolderMenu(false);
    } catch (err) {
      setError('Failed to move folder');
      console.error(err);
    }
  };

  const updateFolderName = async (folderId, newName) => {
    try {
      await db.folders.update(folderId, {
        name: newName,
        lastModified: new Date().toISOString(),
        syncStatus: 'pending'
      });
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
      await db.folders.delete(folderToDelete.id);
      
      await db.notes
        .where('folderId')
        .equals(folderToDelete.id)
        .modify({ folderId: null });
      
      await fetchFolders();
      setShowDeleteConfirm(false);
      setFolderToDelete(null);
    } catch (err) {
      setError('Failed to delete folder');
      console.error(err);
    }
  };

  const handleFolderChange = () => {
    fetchFolders();
  };

  // 添加新的动画效果
  const slideAnimation = isOpen 
    ? "translate-x-0 opacity-100" 
    : "-translate-x-3 opacity-0";

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30
      ${isOpen ? 'w-64' : 'w-16'}
      transition-all duration-300 ease-in-out
      bg-white/95 backdrop-blur-sm
      border-r border-gray-100/80
      flex flex-col
      shadow-lg shadow-gray-100/50
    `}>
      {/* Logo Section - 添加毛玻璃效果 */}
      <div className="h-16 flex items-center justify-between px-4 
        border-b border-gray-50/80 backdrop-blur-sm bg-white/50">
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="Logo"
            className={`h-8 w-8 object-contain transition-all duration-300
              ${!isOpen ? 'mx-auto scale-90' : 'scale-100'}`} 
          />
          {isOpen && (
            <span className={`ml-3 font-semibold text-gray-800 
              transition-all duration-300 ${slideAnimation}`}>
              VoiceNote
            </span>
          )}
        </div>
      </div>

      {/* Toggle Button - 改进视觉效果 */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-20 w-7 h-7 bg-white/95 
          backdrop-blur-sm border border-gray-200/80 
          rounded-full flex items-center justify-center 
          shadow-lg shadow-gray-200/50 hover:shadow-gray-300/50 
          transition-all duration-200 hover:border-blue-200 
          hover:bg-blue-50/80 group"
      >
        <FiChevronLeft 
          className={`w-4 h-4 text-gray-600 transition-all duration-200 
            group-hover:text-blue-500 ${!isOpen && 'rotate-180'}`} 
        />
      </button>

      {/* Menu Section - 添加滚动条美化 */}
      <div className="flex-1 overflow-y-auto 
        scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300
        scrollbar-track-transparent">
        <div className="px-3 py-4 space-y-1">
          {isOpen && (
            <div className={`text-xs font-medium text-gray-400 px-3 mb-2 
              uppercase tracking-wider transition-all duration-300 ${slideAnimation}`}>
              Menu
            </div>
          )}
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`
                flex items-center px-3 py-2.5 rounded-xl
                transition-all duration-200 group
                ${location.pathname === item.path 
                  ? 'bg-blue-50/80 text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'
                }
                ${!isOpen && 'justify-center'}
              `}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200
                group-hover:scale-110 ${isOpen && 'mr-3'}`} />
              {isOpen && (
                <span className={`text-sm font-medium transition-all duration-300 ${slideAnimation}`}>
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Folders Section - 改进视觉层次 */}
        <div className="px-3 py-4">
          {isOpen && (
            <div className="flex items-center justify-between px-3 mb-2">
              <span className={`text-xs font-medium text-gray-400 
                uppercase tracking-wider transition-all duration-300 ${slideAnimation}`}>
                Folders
              </span>
              <button 
                onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
                className="p-1.5 hover:bg-gray-100/80 rounded-lg transition-colors"
              >
                {isFoldersExpanded 
                  ? <FiChevronDown className="w-4 h-4 text-gray-500" /> 
                  : <FiChevronRight className="w-4 h-4 text-gray-500" />
                }
              </button>
            </div>
          )}
          
          {/* Folders List - 添加动画和交互效果 */}
          <div className={`space-y-1 transition-all duration-300 
            ${!isFoldersExpanded && 'opacity-50'}`}>
            {(isOpen && isFoldersExpanded) && folders.map((folder) => (
              <div key={folder.id}
                className={`group relative transition-all duration-200
                  ${selectedFolder?.id === folder.id ? 'z-10' : 'z-0'}`}
              >
                <div
                  className={`
                    flex items-center justify-between px-3 py-2.5 rounded-xl
                    transition-all duration-200
                    hover:bg-gray-50/80 cursor-pointer
                    ${selectedFolder?.id === folder.id 
                      ? 'bg-gray-50/80 shadow-sm' 
                      : ''
                    }
                  `}
                  onClick={(e) => handleFolderClick(folder, e)}
                  onContextMenu={(e) => handleFolderClick(folder, e)}
                >
                  {editingFolder?.id === folder.id ? (
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingFolder.name}
                      onChange={(e) => setEditingFolder({...editingFolder, name: e.target.value})}
                      onBlur={() => updateFolderName(folder.id, editingFolder.name)}
                      onKeyPress={(e) => e.key === 'Enter' && updateFolderName(folder.id, editingFolder.name)}
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="flex items-center flex-1 min-w-0">
                        <FiFolder className="h-4 w-4 text-gray-400 flex-shrink-0 mr-3" />
                        <span className="text-sm text-gray-700 truncate">{folder.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">{folder.count}</span>
                    </>
                  )}
                </div>

                {/* 改进上下文菜单样式 */}
                {showFolderMenu && selectedFolder?.id === folder.id && (
                  <div 
                    ref={folderMenuRef}
                    className="absolute left-full ml-2 bg-white/95 backdrop-blur-sm
                      border border-gray-100/80 rounded-xl shadow-xl py-1.5 z-30
                      min-w-[160px] transform transition-all duration-200"
                  >
                    <button
                      onClick={() => moveFolder(folder.id, 'up')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center text-gray-700"
                    >
                      <FiArrowUp className="mr-2 w-4 h-4" /> Move Up
                    </button>
                    <button
                      onClick={() => moveFolder(folder.id, 'down')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center text-gray-700"
                    >
                      <FiArrowDown className="mr-2 w-4 h-4" /> Move Down
                    </button>
                    <button
                      onClick={() => {
                        setEditingFolder(folder);
                        setShowFolderMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center text-gray-700"
                    >
                      <FiEdit2 className="mr-2 w-4 h-4" /> Rename
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={() => handleDeleteClick(folder)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center text-red-600"
                    >
                      <FiTrash2 className="mr-2 w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="border-t border-gray-100/80 p-3 
        bg-gradient-to-b from-white/50 to-gray-50/30
        backdrop-blur-sm relative"
      >
        <button 
          className="
            flex items-center w-full px-3 py-2.5 rounded-xl
            transition-all duration-200 group
            text-gray-600 hover:bg-gray-100/80 hover:text-gray-900
          "
          onClick={handleSettingsClick}
        >
          <FiSettings className="h-5 w-5 mr-3 transition-transform duration-200
            group-hover:rotate-45" />
          <span className="text-sm font-medium">
            Settings
          </span>
        </button>

        {/* Settings Menu Dropdown */}
        {showSettingsMenu && (
          <div 
            ref={settingsMenuRef}
            className="absolute bottom-16 left-0 w-full bg-white/95 backdrop-blur-sm
              border-t border-gray-100/80 rounded-t-xl shadow-xl py-1.5
              transform transition-all duration-200"
          >
            <button
              onClick={() => {
                setShowSettings(true);
                setShowSettingsMenu(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700"
            >
              Settings
            </button>
            <div className="h-px bg-gray-100 my-1" />
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSettings && (
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}
      {showBilling && (
        <BillingModal 
          isOpen={showBilling} 
          onClose={() => setShowBilling(false)} 
        />
      )}
    </div>
  );
}

export default Sidebar; 