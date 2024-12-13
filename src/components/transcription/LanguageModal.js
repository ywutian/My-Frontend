import React from 'react';

const languages = [
  { code: 'en', name: '英语', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: '西班牙语', flag: '🇪🇸' },
  { code: 'fr', name: '法语', flag: '🇫🇷' },
  { code: 'de', name: '德语', flag: '🇩🇪' },
  // 可根据需要添加更多语言
];

function LanguageModal({
  transcriptionLanguage,
  translationLanguage,
  isTranslating,
  onTranscriptionLanguageChange,
  onTranslationLanguageChange,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4">语言设置</h3>

        {/* 转录语言设置 */}
        <div className="mb-6">
          <p className="text-sm mb-2">转录语言</p>
          <div className="flex gap-2 flex-wrap">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`flex items-center gap-2 p-2 border rounded-lg transition ${
                  transcriptionLanguage === lang.code
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => onTranscriptionLanguageChange(lang.code)}
              >
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 翻译目标语言设置（可选） */}
        {isTranslating && (
          <div className="mb-6">
            <p className="text-sm mb-2">翻译目标语言</p>
            <div className="flex gap-2 flex-wrap">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`flex items-center gap-2 p-2 border rounded-lg transition ${
                    translationLanguage === lang.code
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => onTranslationLanguageChange(lang.code)}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 关闭按钮 */}
        <button
          className="mt-4 w-full p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          onClick={onClose}
        >
          关闭
        </button>
      </div>
    </div>
  );
}

export default LanguageModal;
