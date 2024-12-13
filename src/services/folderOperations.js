import { db } from '../db/db';

export const createFolder = async (folderData, onSuccess = null) => {
  try {
    // Check if folder with same name already exists
    const existingFolder = await db.folders
      .where('name')
      .equals(folderData.name.trim())
      .first();

    if (existingFolder) {
      throw new Error('A folder with this name already exists');
    }

    const folder = {
      ...folderData,
      name: folderData.name.trim(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      syncStatus: 'pending',
    };

    const id = await db.folders.add(folder);
    
    // Call the success callback if provided
    if (onSuccess) {
      onSuccess(id);
    }

    return id;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

export const addNoteToFolder = async (noteId, folderId) => {
  try {
    await db.notes.update(noteId, {
      folderId,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending',
    });
  } catch (error) {
    console.error('Error adding note to folder:', error);
    throw error;
  }
};

export const getFolderNotes = async (folderId) => {
  try {
    return await db.notes.where('folderId').equals(folderId).toArray();
  } catch (error) {
    console.error('Error getting folder notes:', error);
    throw error;
  }
};

export const removeFromFolder = async (noteId) => {
  try {
    await db.notes.update(noteId, {
      folderId: null,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending',
    });
  } catch (error) {
    console.error('Error removing note from folder:', error);
    throw error;
  }
};

// Add this function to validate folder name when renaming
export const validateFolderName = async (name, excludeFolderId = null) => {
  const existingFolder = await db.folders
    .where('name')
    .equals(name.trim())
    .first();

  if (existingFolder && existingFolder.id !== excludeFolderId) {
    throw new Error('A folder with this name already exists');
  }
  return true;
};

// Update the rename folder function to use validation
export const renameFolder = async (folderId, newName) => {
  try {
    // Validate the new name
    await validateFolderName(newName, folderId);

    await db.folders.update(folderId, {
      name: newName.trim(),
      lastModified: new Date().toISOString(),
      syncStatus: 'pending',
    });
  } catch (error) {
    console.error('Error renaming folder:', error);
    throw error;
  }
};
