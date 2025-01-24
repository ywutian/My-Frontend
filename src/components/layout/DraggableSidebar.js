import React, { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import {
  FiChevronRight,
  FiChevronLeft,
  FiChevronUp,
  FiChevronDown,
} from 'react-icons/fi';

const DraggableSidebar = ({
  children,
  title = 'Sidebar',
  defaultWidth = 300,
  defaultHeight = 300,
  minWidth = 280,
  minHeight = 200,
  maxWidth = 800,
  maxHeight = 600,
  initialPosition = 'right',
  defaultTab,
  onStateChange,
}) => {
  const [size, setSize] = useState({
    width: Math.min(Math.max(defaultWidth, minWidth), maxWidth),
    height: Math.min(Math.max(defaultHeight, minHeight), maxHeight),
  });
  const [position, setPosition] = useState(initialPosition);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDraggingPosition, setIsDraggingPosition] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // 标签页状态
  const tabs = useMemo(() => 
    React.Children.toArray(children).map((child) => ({
      label: child.props.label,
      content: child,
    })), [children]
  );
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.label);

  const COLLAPSE_THRESHOLD = 100;
  const COLLAPSED_SIZE = 40;
  const POSITION_SWITCH_THRESHOLD = 100;

  const STYLES = {
    base: {
      transition: 'all 0.2s ease-out',
      background: 'white',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      position: 'absolute',
      zIndex: 10,
    },
    // ...
  };

  useEffect(() => {
    onStateChange?.({
      isCollapsed,
      size,
      COLLAPSED_SIZE
    });
  }, [isCollapsed, size, onStateChange]);

  useEffect(() => {
    // Update size when default dimensions change
    setSize(prev => ({
      width: Math.min(Math.max(defaultWidth, minWidth), maxWidth),
      height: Math.min(Math.max(defaultHeight, minHeight), maxHeight),
    }));
  }, [defaultWidth, defaultHeight, minWidth, minHeight, maxWidth, maxHeight]);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = isCollapsed ? minWidth : size.width;
    const startHeight = isCollapsed ? minHeight : size.height;

    const handleMouseMove = (e) => {
      if (position === 'right') {
        const deltaX = startX - e.clientX;
        const newWidth = startWidth + deltaX;

        if (newWidth < COLLAPSE_THRESHOLD) {
          setIsCollapsed(true);
          const newSize = { width: COLLAPSED_SIZE, height: size.height };
          setSize(newSize);
        } else {
          setIsCollapsed(false);
          const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
          const newSize = { width: clampedWidth, height: size.height };
          setSize(newSize);
        }
      } else {
        const deltaY = startY - e.clientY;
        const newHeight = startHeight + deltaY;

        const deltaX = e.clientX - startX;
        if (Math.abs(deltaX) > POSITION_SWITCH_THRESHOLD && !isDraggingPosition) {
          setIsDraggingPosition(true);
          setPosition('right');
          setSize({
            width: defaultWidth,
            height: window.innerHeight,
          });
          return;
        }

        if (newHeight < COLLAPSE_THRESHOLD) {
          setIsCollapsed(true);
          setSize((prev) => ({ ...prev, height: COLLAPSED_SIZE }));
        } else {
          setIsCollapsed(false);
          const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
          setSize((prev) => ({ ...prev, height: clampedHeight }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsDraggingPosition(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'auto';
    };

    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [
    isCollapsed, size, minWidth, minHeight, maxWidth, maxHeight,
    position, defaultWidth, COLLAPSE_THRESHOLD, POSITION_SWITCH_THRESHOLD
  ]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  const getStyle = () => {
    const baseStyle = {
      transition: isResizing ? 'none' : 'all 0.2s ease-out',
      background: 'white',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      position: 'absolute',
      zIndex: 10,
    };

    if (position === 'right') {
      return {
        ...baseStyle,
        top: 0,
        right: 0,
        width: isCollapsed ? COLLAPSED_SIZE : Math.min(Math.max(size.width, minWidth), maxWidth),
        height: '100%',
        borderLeft: '1px solid #e5e7eb',
      };
    } else {
      return {
        ...baseStyle,
        bottom: 0,
        left: 0,
        width: '100vw',
        height: isCollapsed ? COLLAPSED_SIZE : Math.min(Math.max(size.height, minHeight), maxHeight),
        borderTop: '1px solid #e5e7eb',
      };
    }
  };

  const Tab = memo(({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium text-sm transition-all relative
        ${isActive 
          ? 'text-blue-600 bg-white before:absolute before:bottom-0 before:left-0 before:w-full before:h-[2px] before:bg-blue-500' 
          : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50 before:absolute before:bottom-0 before:left-0 before:w-full before:h-[2px] before:bg-transparent hover:before:bg-blue-200'
        }`}
    >
      {label}
    </button>
  ));

  return (
    <div style={getStyle()} className="flex bg-white shadow-lg">
      {/* Resize Handle */}
      <div
        className={`absolute ${
          position === 'right'
            ? 'left-0 top-0 w-4 h-full cursor-col-resize -ml-2 z-10'
            : 'top-0 left-0 w-full h-4 cursor-row-resize -mt-2 z-10'
        } group`}
        onMouseDown={handleResizeStart}
      >
        {/* Resize Line */}
        <div
          className={`absolute ${
            position === 'right'
              ? 'left-1/2 top-0 w-[2px] h-full -translate-x-1/2'
              : 'top-1/2 left-0 h-[2px] w-full -translate-y-1/2'
          } ${
            isResizing 
              ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
              : 'bg-gray-200 group-hover:bg-blue-400'
          } transition-all duration-200`}
        />
        
        {/* Collapse Button - Centered */}
        <button
          onClick={toggleCollapse}
          className={`absolute ${
            position === 'right' 
              ? '-left-3 top-1/2 -translate-y-1/2' 
              : 'left-1/2 -translate-x-1/2 -top-3'
          } w-7 h-7 bg-white border rounded-full 
            flex items-center justify-center
            hover:shadow-md hover:border-blue-400 hover:text-blue-500 
            active:scale-95 transition-all duration-200
            ${isResizing ? 'border-blue-400' : 'border-gray-200'}`}
          style={{
            transform: `rotate(${position === 'right' ? 0 : 90}deg)`,
          }}
        >
          {isCollapsed ? (
            <FiChevronRight className="w-5 h-5" />
          ) : (
            <FiChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs Header */}
          <div className="border-b border-gray-200 flex-shrink-0">
            <div className="flex bg-gray-50/50">
              {tabs.map((tab) => (
                <Tab
                  key={tab.label}
                  label={tab.label}
                  isActive={activeTab === tab.label}
                  onClick={() => setActiveTab(tab.label)}
                />
              ))}
            </div>
          </div>

          {/* Active Tab Content - New Optimization */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            <div className="h-full rounded-lg bg-white">
              <div className="h-full relative">
                {tabs.find((tab) => tab.label === activeTab)?.content}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
          <span
            className={`text-gray-600 font-medium tracking-wide select-none
              ${position === 'right' ? 'rotate-180' : ''} 
              ${position === 'right' ? 'px-2' : 'py-2'}
              hover:text-blue-500 transition-colors duration-200`}
            style={{
              writingMode:
                position === 'right' ? 'vertical-rl' : 'horizontal-tb',
            }}
          >
            {title}
          </span>
        </div>
      )}
    </div>
  );
};

export const COLLAPSED_SIZE = 40;
export default DraggableSidebar;
