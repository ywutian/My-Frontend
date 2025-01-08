import Dexie from 'dexie';
import { api } from '../services/api';

export const db = new Dexie('notesApp');
db.version(4).stores({
  notes:
    '++id, title, content, date, subject, lastModified, syncStatus, audioLanguage, noteLanguage, folderId, transcript, youtubeUrl, attachments',
  attachments: '++id, noteId, fileName, fileType, fileData, size, uploadDate',
  folders: '++id, name, createdAt, lastModified, syncStatus',
  flashcards: '++id, noteId, front, back, syncStatus',
  syncQueue: '++id, operation, data, timestamp',
  quizzes: '++id, noteId, questions, userAnswers, date, score',
});

export const saveNote = async (noteData) => {
  try {
    // 准备笔记数据
    const note = {
      ...noteData,
      date: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      syncStatus: 'pending',
    };

    // 保存到本地数据库
    const id = await db.notes.put(note);

    // 尝试同步到服务器
    try {
      await api.saveNoteToServer(note);
      await db.notes.update(id, { syncStatus: 'synced' });
    } catch (error) {
      // 如果服务器同步失败，将操作加入同步队列
      await db.syncQueue.add({
        operation: 'saveNote',
        data: note,
        timestamp: new Date().toISOString(),
      });
    }

    return id;
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
};

// 获取笔记时优先从本地获取，然后尝试从服务器更新
export const getNote = async (id) => {
  try {
    // 先从本地获取
    const localNote = await db.notes.get(id);

    // 尝试从服务器获取最新版本
    try {
      const serverNote = await api.getNoteFromServer(id);
      if (serverNote.lastModified > localNote?.lastModified) {
        // 服务器版本更新，更新本地数据
        await db.notes.put({
          ...serverNote,
          syncStatus: 'synced',
        });
        return serverNote;
      }
    } catch (error) {
      console.warn('Could not fetch from server, using local data');
    }

    return localNote;
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
};

// 同步队列处理函数
export const processSyncQueue = async () => {
  const queue = await db.syncQueue.toArray();

  for (const item of queue) {
    try {
      switch (item.operation) {
        case 'saveNote':
          await api.saveNoteToServer(item.data);
          break;
        case 'saveFlashcards':
          await api.saveFlashcardsToServer(
            item.data.noteId,
            item.data.flashcards,
          );
          break;
        // ... 其他操作
      }
      // 同步成功后删除队列项
      await db.syncQueue.delete(item.id);
    } catch (error) {
      console.error('Sync failed for item:', item, error);
    }
  }
};

// 定期处理同步队列
setInterval(processSyncQueue, 5 * 60 * 1000); // 每5分钟尝试同步一次

export const updateNote = async (id, updates) => {
  try {
    // Update local database
    await db.notes.update(id, {
      ...updates,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    });

    // Try to sync with server
    try {
      const updatedNote = await db.notes.get(id);
      await api.saveNoteToServer(updatedNote);
      await db.notes.update(id, { syncStatus: 'synced' });
    } catch (error) {
      // If server sync fails, add to sync queue
      await db.syncQueue.add({
        operation: 'saveNote',
        data: await db.notes.get(id),
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const saveAttachment = async (noteId, file) => {
  try {
    const fileData = await file.arrayBuffer(); // Convert file to ArrayBuffer for storage
    
    const attachment = {
      noteId,
      fileName: file.name,
      fileType: file.type,
      fileData,
      size: file.size,
      uploadDate: new Date().toISOString()
    };

    const attachmentId = await db.attachments.add(attachment);
    
    // Update note's attachments array
    await db.notes.update(noteId, {
      attachments: Dexie.Value.arrayUnion(attachmentId)
    });

    return attachmentId;
  } catch (error) {
    console.error('Error saving attachment:', error);
    throw error;
  }
};

export const getAttachment = async (attachmentId) => {
  try {
    const attachment = await db.attachments.get(attachmentId);
    if (!attachment) throw new Error('Attachment not found');
    
    // Convert ArrayBuffer back to Blob
    const blob = new Blob([attachment.fileData], { type: attachment.fileType });
    return {
      ...attachment,
      blob
    };
  } catch (error) {
    console.error('Error getting attachment:', error);
    throw error;
  }
};

export const deleteAttachment = async (attachmentId, noteId) => {
  try {
    await db.attachments.delete(attachmentId);
    
    // Remove attachment ID from note's attachments array
    await db.notes.update(noteId, {
      attachments: Dexie.Value.arrayDelete(attachmentId)
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    throw error;
  }
};
