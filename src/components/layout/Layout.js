import { useState } from 'react';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme } = useTheme();

  const bgClasses = {
    light: 'bg-gray-50',  // 浅色主题背景
    dark: 'bg-gray-900'   // 深色主题背景
  };

  return (
    <div className="flex h-screen">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <main 
        className={`
          flex-1 overflow-auto transition-colors duration-300
          ${bgClasses[theme]}
          ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}
        `}
      >
        {children}
      </main>
    </div>
  );
}

export default Layout; 