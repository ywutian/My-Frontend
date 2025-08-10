import _axios from 'axios';

const _API_URL = process.env.REACT_APP_API_URL;
const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY;

export const transcribeAudio = async (formData) => {
  try {
    console.log('Starting audio transcription...');
    const audioFile = formData.get('audio');
    const audioLanguage = formData.get('audioLanguage');
    const userTitle = formData.get('title');

    // 检查文件大小限制 (2GB)
    if (audioFile.size > 2 * 1024 * 1024 * 1024) {
      throw new Error('File size exceeds 2GB limit');
    }

    // 设置 Deepgram API 参数
    const params = new URLSearchParams({
      model: 'nova-2',       // 使用最新的 nova-2 模型
      smart_format: 'true',  // 启用智能格式化
      language: audioLanguage,    // 使用用户选择的语言
      punctuate: 'true',     // 启用标点
      utterances: 'true'     // 启用语句分段
    });

    console.log('Sending request to Deepgram API with language:', audioLanguage);
    const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      },
      body: audioFile
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Transcription API error:', errorData);
      
      // 处理特定错误
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (response.status === 504) {
        throw new Error('Transcription timeout. File may be too long.');
      }

      throw new Error(`API error: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Transcription completed successfully');
    
    // 从响应中提取转录文本
    const transcription = data.results?.channels[0]?.alternatives[0]?.transcript || '';
    const confidence = data.results?.channels[0]?.alternatives[0]?.confidence || 0;
    
    console.log('Transcription details:', {
      length: transcription.length,
      confidence: confidence,
      duration: data.metadata?.duration
    });

    // 如果没有用户提供的标题，使用 AI 生成标题
    let suggestedTitle = userTitle;
    if (!userTitle) {
      try {
        const titleResponse = await generateTitleFromTranscription(transcription);
        suggestedTitle = titleResponse.title;
      } catch (error) {
        console.error('Error generating title:', error);
        suggestedTitle = new Date().toLocaleDateString(); // 如果生成失败，使用日期作为默认标题
      }
    }

    return {
      transcription,
      suggestedTitle,
      confidence,
      duration: data.metadata?.duration
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio: ' + error.message);
  }
};

async function generateTitleFromTranscription(transcription) {
  try {
    const response = await fetch('/api/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcription: transcription.substring(0, 500), // 只使用前500个字符来生成标题
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate title');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating title:', error);
    throw error;
  }
} 