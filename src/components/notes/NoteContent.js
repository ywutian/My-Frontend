import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useRef, useCallback } from 'react';
import useDebounce from '../../hooks/useDebounce';

export default function NoteContent({ 
  content, 
  onEdit,
  isEditing = false, 
  editContent = '', 
  onEditChange,
  onSave,
  readOnly = false 
}) {
  const editorRef = useRef(null);
  const debouncedContent = useDebounce(editContent, 1000);
  const lastSavedContent = useRef(content);
  const isInitialMount = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: '编辑笔记内容...',
        showOnlyWhenEditable: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: editContent || content,
    editable: isEditing,
    autofocus: isEditing ? 'end' : false,
    onUpdate: ({ editor }) => {
      onEditChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px]',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  const handleClickOutside = useCallback((event) => {
    if (editorRef.current && 
        !editorRef.current.contains(event.target) && 
        editContent !== lastSavedContent.current) {
      onSave?.();
      lastSavedContent.current = editContent;
    }
  }, [editContent, onSave]);

  useEffect(() => {
    if (!isEditing) return;

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, handleClickOutside]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const shouldSave = isEditing && 
                      debouncedContent !== lastSavedContent.current && 
                      debouncedContent !== content &&
                      debouncedContent.trim() !== '';

    if (shouldSave) {
      onSave?.();
      lastSavedContent.current = debouncedContent;
    }
  }, [debouncedContent, isEditing, onSave, content]);

  if (!editor) {
    return null;
  }

  return (
    <div 
      className={`rounded-xl transition-all duration-300 ${
        isEditing 
          ? 'ring-2 ring-blue-400/50 shadow-[0_0_0_1px_rgba(59,130,246,0.1)]' 
          : 'hover:ring-1 hover:ring-blue-300/30'
      }`} 
      ref={editorRef}
    >
      <div 
        className={`
          ${!readOnly && !isEditing ? 'hover:bg-white/50 hover:backdrop-blur-sm' : ''} 
          rounded-xl p-4 sm:p-5 transition-all duration-300`}
        onClick={() => !readOnly && !isEditing && onEdit?.()}
      >
        <EditorContent 
          editor={editor}
          className={`
            prose prose-sm max-w-none focus:outline-none min-h-[100px]
            prose-headings:font-semibold 
            prose-h1:text-2xl prose-h1:mb-4 prose-h1:text-gray-800
            prose-h2:text-xl prose-h2:mb-3 prose-h2:text-gray-800
            prose-h3:text-lg prose-h3:mb-2 prose-h3:text-gray-800
            prose-p:mb-2 prose-p:leading-relaxed prose-p:text-gray-600
            prose-ul:ml-4 prose-ul:mb-2 
            prose-ol:ml-4 prose-ol:mb-2
            prose-li:mb-1 prose-li:text-gray-600
            prose-blockquote:border-l-4 prose-blockquote:border-blue-200/50 
            prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-500
            prose-pre:bg-white/60 prose-pre:backdrop-blur-sm prose-pre:p-4 
            prose-pre:rounded-lg prose-pre:shadow-sm
            prose-code:bg-white/60 prose-code:backdrop-blur-sm prose-code:px-1.5 
            prose-code:py-0.5 prose-code:rounded prose-code:text-sm 
            prose-code:font-mono prose-code:text-gray-600
            selection:bg-blue-100/50 selection:text-blue-900
          `}
        />
      </div>
    </div>
  );
} 