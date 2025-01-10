import { db } from '../db/db';

const TRANSCRIPT_API_URL = process.env.REACT_APP_TRANSCRIPT_API_URL || 'http://localhost:5001/transcript';

export const youtubeService = {
  async processYouTubeVideo(youtubeUrl, title) {
    try {
      console.log('=== Start Processing YouTube Video ===');
      console.log('Input:', { youtubeUrl, title });
      
      // 1. 获取视频 ID
      const videoId = this.extractVideoId(youtubeUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }
      console.log('Successfully extracted video ID:', videoId);

      // 2. 获取字幕
      console.log('Fetching transcript...');
      const transcriptResponse = await fetch(`${TRANSCRIPT_API_URL}?videoId=${videoId}`);
      
      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json();
        throw new Error(errorData.error || 'Failed to fetch transcript');
      }

      const transcriptData = await transcriptResponse.json();
      console.log('Transcript data received:', transcriptData);

      // 将字幕数组转换为文本
      const content = transcriptData.transcript
        .map(item => item.text)
        .join('\n');

      // 3. 保存到数据库
      const noteData = {
        title: title || 'YouTube Note',
        content: content,
        type: 'youtube',
        metadata: {
          youtubeUrl,
          videoId,
          transcript: content,
          language: transcriptData.language,
          language_code: transcriptData.language_code,
          date: new Date().toISOString()
        },
        date: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        syncStatus: 'pending'
      };

      console.log('Saving note data:', JSON.stringify(noteData, null, 2));
      const noteId = await db.notes.add(noteData);
      
      return {
        noteId,
        content: content,
        metadata: noteData.metadata
      };

    } catch (error) {
      console.error('=== YouTube Video Processing Failed ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  extractVideoId(url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
      return null;
    } catch (e) {
      console.error('URL parsing error:', e);
      return null;
    }
  }
};