import React, { useState, useRef, useEffect } from 'react';
import {
  MicrophoneIcon,
  StopIcon,
  LanguageIcon,
  MinusIcon,
  WindowIcon,
} from '@heroicons/react/24/solid';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
];

export function TranscriptionControls({
  isRecording,
  isTranslating,
  speechLanguage = 'en',
  transcriptionLanguage = 'en',
  translationLanguage = 'zh',
  onSpeechLanguageChange,
  onTranscriptionLanguageChange,
  onTranslationLanguageChange,
  onRecordingToggle,
  onTranslationToggle,
}) {
  const [position, setPosition] = useState({
    x: window.innerWidth - 420,
    y: 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isNearEdge, setIsNearEdge] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [activeSettings, setActiveSettings] = useState(null);
  const [edgePosition, setEdgePosition] = useState(null);

  const controlsRef = useRef(null);
  const minimizedRef = useRef(null);

  const currentSpeechLang =
    languages.find((l) => l.code === speechLanguage) || languages[0];
  const currentTransLang =
    languages.find((l) => l.code === transcriptionLanguage) || languages[0];
  const currentTargetLang =
    languages.find((l) => l.code === translationLanguage) || languages[1];

  const checkEdgePosition = (x, y) => {
    const threshold = 15;
    const screenWidth = window.innerWidth;
    const elementWidth =
      (isMinimized ? minimizedRef.current : controlsRef.current)?.offsetWidth ||
      400;

    if (x < threshold) {
      return 'left';
    } else if (x > screenWidth - elementWidth - threshold) {
      return 'right';
    }
    return null;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = position.x + (e.clientX - dragStart.x);
        const newY = position.y + (e.clientY - dragStart.y);

        const edge = checkEdgePosition(newX, newY);
        setEdgePosition(edge);
        setIsNearEdge(!!edge);

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const elementWidth =
          (isMinimized ? minimizedRef.current : controlsRef.current)
            ?.offsetWidth || 400;
        const elementHeight =
          (isMinimized ? minimizedRef.current : controlsRef.current)
            ?.offsetHeight || 200;

        const boundedX = Math.max(
          0,
          Math.min(screenWidth - elementWidth, newX),
        );
        const boundedY = Math.max(
          0,
          Math.min(screenHeight - elementHeight, newY),
        );

        setDragStart({ x: e.clientX, y: e.clientY });
        setPosition({ x: boundedX, y: boundedY });
      }
    };

    const handleMouseUp = (e) => {
      if (isDragging) {
        setIsDragging(false);
        if (edgePosition) {
          const elementWidth =
            (isMinimized ? minimizedRef.current : controlsRef.current)
              ?.offsetWidth || 400;
          requestAnimationFrame(() => {
            setPosition((prev) => ({
              ...prev,
              x: edgePosition === 'left' ? 0 : window.innerWidth - elementWidth,
            }));
          });
        }
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position, isMinimized, edgePosition]);

  useEffect(() => {
    let hideTimeout;
    if (isNearEdge && !isDragging) {
      hideTimeout = setTimeout(() => {
        setIsHidden(true);
      }, 800);
    }
    return () => clearTimeout(hideTimeout);
  }, [isNearEdge, isDragging]);

  const startDragging = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseEnter = () => {
    setIsHidden(false);
  };

  const handleMouseLeave = () => {
    if (isNearEdge && !isDragging) {
      setIsHidden(true);
    }
  };

  const handleLanguageSelect = (type, langCode) => {
    switch (type) {
      case 'speech':
        onSpeechLanguageChange(langCode);
        break;
      case 'source':
        onTranscriptionLanguageChange(langCode);
        break;
      case 'target':
        onTranslationLanguageChange(langCode);
        break;
    }
    setActiveSettings(null);
  };

  const getHiddenPosition = () => {
    if (!isHidden) return position.x;
    const elementWidth =
      (isMinimized ? minimizedRef.current : controlsRef.current)?.offsetWidth ||
      400;
    return edgePosition === 'left'
      ? -elementWidth + 50
      : window.innerWidth - 50;
  };

  if (isMinimized) {
    return (
      <div
        ref={minimizedRef}
        className={`fixed flex items-center gap-2 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg 
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
        style={{
          left: getHiddenPosition(),
          top: position.y,
          transition: isDragging ? 'none' : 'all 0.3s ease-in-out',
        }}
        onMouseDown={startDragging}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          if (!isDragging) {
            setIsMinimized(false);
          }
        }}
      >
        <WindowIcon className="w-5 h-5 text-gray-600" />
        <span className="text-sm text-gray-600">Language Controls</span>
      </div>
    );
  }

  return (
    <>
      {activeSettings && (
        <div
          className="fixed bg-white rounded-lg shadow-lg z-40"
          style={{
            left: position.x,
            top: position.y - 220,
          }}
        >
          <div className="p-3 w-[400px]">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {activeSettings === 'speech'
                ? 'Select Speech Recognition Language'
                : activeSettings === 'source'
                  ? 'Select Source Text Language'
                  : 'Select Target Language'}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() =>
                    handleLanguageSelect(activeSettings, lang.code)
                  }
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors
                    ${
                      (activeSettings === 'speech' &&
                        speechLanguage === lang.code) ||
                      (activeSettings === 'source' &&
                        transcriptionLanguage === lang.code) ||
                      (activeSettings === 'target' &&
                        translationLanguage === lang.code)
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        ref={controlsRef}
        className="fixed bg-white/90 backdrop-blur rounded-lg shadow-lg z-30 w-[400px] select-none"
        style={{
          left: getHiddenPosition(),
          top: position.y,
          transition: isDragging ? 'none' : 'all 0.3s ease-in-out',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`flex items-center justify-between p-2 border-b border-gray-200
            ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={startDragging}
        >
          <span className="text-sm font-medium text-gray-600">
            Language Controls
          </span>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MinusIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onRecordingToggle}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-1
                ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {isRecording ? (
                <>
                  <StopIcon className="w-5 h-5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <MicrophoneIcon className="w-5 h-5" />
                  <span>Record</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-16">Speech:</span>
              <button
                onClick={() =>
                  setActiveSettings(
                    activeSettings === 'speech' ? null : 'speech',
                  )
                }
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 flex-1"
              >
                <span className="text-lg">{currentSpeechLang.flag}</span>
                <span>{currentSpeechLang.name}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-16">Text:</span>
              <button
                onClick={() =>
                  setActiveSettings(
                    activeSettings === 'source' ? null : 'source',
                  )
                }
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 flex-1"
              >
                <span className="text-lg">{currentTransLang.flag}</span>
                <span>{currentTransLang.name}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-16">Translate:</span>
              <button
                onClick={onTranslationToggle}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-1
                  ${isTranslating ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <LanguageIcon className="w-5 h-5" />
                <span>{isTranslating ? 'On' : 'Off'}</span>
              </button>
            </div>

            {isTranslating && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-16">To:</span>
                <button
                  onClick={() =>
                    setActiveSettings(
                      activeSettings === 'target' ? null : 'target',
                    )
                  }
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 flex-1"
                >
                  <span className="text-lg">{currentTargetLang.flag}</span>
                  <span>{currentTargetLang.name}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default TranscriptionControls;
