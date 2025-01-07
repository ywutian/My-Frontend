import React, { useState } from 'react';
import Modal from '../common/Modal';
import { FiFolder } from 'react-icons/fi';
import FolderSelector from '../Folder/FolderSelector';
import { db } from '../../db/db';

const CreateNoteModal = ({ isOpen, onClose, onSubmit, initialContent, suggestedTitle }) => {
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const finalTitle = title.trim() || suggestedTitle || new Date().toLocaleDateString();
    formData.set('title', finalTitle);
    
    if (selectedFolder) {
      formData.set('folderId', selectedFolder.id);
      formData.set('folderName', selectedFolder.name);
    }
    if (initialContent) {
      formData.set('content', initialContent);
    }
    onSubmit(formData);
  };

  const handleFolderSelect = async (folderId) => {
    const folder = await db.folders.get(folderId);
    setSelectedFolder(folder);
    setShowFolderSelector(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Create Note">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-edium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={suggestedTitle || "Enter note title (optional)"}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {!title && suggestedTitle && (
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to use AI generated title
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Note Language
            </label>
            <select
              name="noteLanguage"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Folder
            </label>
            <button
              type="button"
              onClick={() => setShowFolderSelector(true)}
              className="mt-1 w-full flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              <FiFolder className="text-gray-400" />
              <span>{selectedFolder ? selectedFolder.name : 'Select Folder'}</span>
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Create Note
            </button>
          </div>
        </form>
      </Modal>

      {showFolderSelector && (
        <FolderSelector
          onSelect={handleFolderSelect}
          onClose={() => setShowFolderSelector(false)}
        />
      )}
    </>
  );
};

export default CreateNoteModal; 