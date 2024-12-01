import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiGrid, 
  FiFileText, 
  FiFolder, 
  FiChevronDown, 
  FiChevronRight,
  FiSettings,
  FiChevronLeft
} from 'react-icons/fi';

function Sidebar({ isOpen, onToggle }) {
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const location = useLocation();
  
  const menuItems = [
    { id: 'dashboard', icon: FiGrid, label: 'Dashboard', path: '/' },
    { id: 'notes', icon: FiFileText, label: 'All Notes', path: '/notes' },
  ];

  const folders = [
    { id: 1, name: 'Study Notes', count: 5 },
    { id: 2, name: 'Work', count: 3 },
    { id: 3, name: 'Personal', count: 2 },
  ];

  return (
    <div className={`
      fixed md:relative
      h-screen
      bg-white
      border-r
      transition-all
      duration-300
      ${isOpen ? 'w-64' : 'w-0 md:w-16'}
      flex
      flex-col
      z-20
    `}>
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="ThetaWave AI" 
            className={`h-8 w-8 ${!isOpen && 'md:mx-auto'}`} 
          />
          {isOpen && <span className="ml-2 font-semibold">ThetaWave AI</span>}
        </div>
        <button 
          onClick={onToggle}
          className="hidden md:block"
        >
          <FiChevronLeft className={`transform transition-transform ${!isOpen && 'rotate-180'}`} />
        </button>
      </div>

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
            <div
              key={folder.id}
              className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <div className="flex items-center">
                <FiFolder className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-600">{folder.name}</span>
              </div>
              <span className="text-xs text-gray-400">{folder.count}</span>
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
          onClick={() => {/* Toggle Settings Modal */}}
        >
          <FiSettings className={`h-5 w-5 ${isOpen && 'mr-3'}`} />
          {isOpen && <span>Settings</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar; 