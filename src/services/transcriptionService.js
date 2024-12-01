import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const authAxios = axios.create();
authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY;

export const transcribeAudio = async (file, language) => {
  console.log('Starting audio transcription...', { 
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    language 
  });
  
  try {
    // 检查文件大小限制 (2GB)
    if (file.size > 2 * 1024 * 1024 * 1024) {
      throw new Error('File size exceeds 2GB limit');
    }

    // 创建 FormData 对象
    const formData = new FormData();
    formData.append('audio', file);

    // 设置 API 参数
    const params = new URLSearchParams({
      model: 'nova-2',       // 使用最新的 nova-2 模型
      smart_format: 'true',  // 启用智能格式化
      language: language,    // 设置语言
      punctuate: 'true',     // 启用标点
      utterances: 'true'     // 启用语句分段
    });

    console.log('Sending request to Deepgram API...');
    const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      },
      body: file  // 直接发送文件，不使用 FormData
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
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || '';
    const confidence = data.results?.channels[0]?.alternatives[0]?.confidence || 0;
    
    console.log('Transcription details:', {
      length: transcript.length,
      confidence: confidence,
      duration: data.metadata?.duration
    });
    
    return transcript;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio: ' + error.message);
  }
}; 