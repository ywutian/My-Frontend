import { useState } from 'react';
import Sidebar from './Sidebar';

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <main className={`flex-1 overflow-auto bg-gradient-to-b from-[#1e3d58] via-[#057dcd] to-[#43b0f1] transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        {children}
      </main>
    </div>
  );
}

export default Layout; 