import React, { useState, useRef, useEffect } from 'react';
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
  onWidthChange,
  onStateChange,
}) => {
  const [size, setSize] = useState({
    width: defaultWidth,
    height: defaultHeight,
  });
  const [position, setPosition] = useState(initialPosition);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDraggingPosition, setIsDraggingPosition] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // 标签页状态
  const tabs = React.Children.toArray(children).map((child) => ({
    label: child.props.label,
    content: child,
  }));
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.label);

  const COLLAPSE_THRESHOLD = 100;
  const COLLAPSED_SIZE = 40;
  const POSITION_SWITCH_THRESHOLD = 100;

  useEffect(() => {
    onStateChange?.({
      isCollapsed,
      size,
      COLLAPSED_SIZE
    });
  }, [isCollapsed, size, onStateChange]);

  const handleResizeStart = (e) => {
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
          onWidthChange?.(COLLAPSED_SIZE);
        } else {
          setIsCollapsed(false);
          const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
          const newSize = { width: clampedWidth, height: size.height };
          setSize(newSize);
          onWidthChange?.(clampedWidth);
        }
      } else {
        const deltaY = startY - e.clientY;
        const newHeight = startHeight + deltaY;

        const deltaX = e.clientX - startX;
        if (
          Math.abs(deltaX) > POSITION_SWITCH_THRESHOLD &&
          !isDraggingPosition
        ) {
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
          const clampedHeight = Math.max(
            minHeight,
            Math.min(maxHeight, newHeight),
          );
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
  };

  const toggleCollapse = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      const newSize = {
        ...size,
        [position === 'right' ? 'width' : 'height']: position === 'right' ? minWidth : minHeight,
      };
      setSize(newSize);
      onWidthChange?.(newSize.width);
    } else {
      setIsCollapsed(true);
      const newSize = {
        ...size,
        [position === 'right' ? 'width' : 'height']: COLLAPSED_SIZE,
      };
      setSize(newSize);
      onWidthChange?.(COLLAPSED_SIZE);
    }
  };

  const getStyle = () => {
    const baseStyle = {
      transition: isResizing ? 'none' : 'all 0.2s ease-out',
      background: 'white',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      position: 'fixed',
      zIndex: 10,
    };

    if (position === 'right') {
      return {
        ...baseStyle,
        top: 0,
        right: 0,
        width: size.width,
        height: '100vh',
        borderLeft: '1px solid #e5e7eb',
      };
    } else {
      return {
        ...baseStyle,
        bottom: 0,
        left: 0,
        width: '100vw',
        height: size.height,
        borderTop: '1px solid #e5e7eb',
      };
    }
  };

  return (
    <div style={getStyle()} className="flex">
      {/* Resize Handle */}
      <div
        className={`absolute ${
          position === 'right'
            ? 'left-0 top-0 w-4 h-full cursor-col-resize -ml-2 z-10'
            : 'top-0 left-0 w-full h-4 cursor-row-resize -mt-2 z-10'
        } group`}
        onMouseDown={handleResizeStart}
      >
        <div
          className={`absolute ${
            position === 'right'
              ? 'left-1/2 top-0 w-1 h-full -translate-x-1/2'
              : 'top-1/2 left-0 h-1 w-full -translate-y-1/2'
          } ${isResizing ? 'bg-purple-500' : 'bg-gray-200 group-hover:bg-purple-500'}`}
        />
        <button
          onClick={toggleCollapse}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
        >
          {position === 'right' ? (
            isCollapsed ? (
              <FiChevronLeft />
            ) : (
              <FiChevronRight />
            )
          ) : isCollapsed ? (
            <FiChevronDown />
          ) : (
            <FiChevronUp />
          )}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="border-b flex-shrink-0">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab.label
                      ? 'border-b-2 border-purple-500 text-purple-500'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {tabs.find((tab) => tab.label === activeTab)?.content}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span
            className={`text-gray-400 ${position === 'right' ? 'rotate-180' : ''}`}
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
