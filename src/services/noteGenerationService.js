import { db } from '../db/db';
const SILICONFLOW_API_KEY = process.env.REACT_APP_SILICONFLOW_API_KEY;

export const generateNote = async (transcript, noteLanguage) => {
  console.log('Starting note generation...', { 
    transcriptLength: transcript.length,
    targetLanguage: noteLanguage 
  });

  // 添加日志来检查接收到的语言参数
  console.log('generateNote called with language:', noteLanguage);

  // 根据不同语言设置系统提示
  const systemPrompts = {
    en: `You are a professional note taker. Create a well-structured academic note in English from the following transcript:
         
         # Title
         
         ## Key Concepts
         - [Concept 1]: [Brief explanation]
         - [Concept 2]: [Brief explanation]
         
         ## Main Points
         1. [First main point]
         2. [Second main point]
         
         ## Important Details
         - [Detail 1]
         - [Detail 2]
         
         ## Summary
         [Brief summary of the content]`,

    zh: `你是一位专业的笔记整理者。请将以下文本整理成结构清晰的学术笔记：

         # 标题
         
         ## 核心概念
         - [概念1]：[简要解释]
         - [概念2]：[简要解释]
         
         ## 主要观点
         1. [第一个要点]
         2. [第二个要点]
         
         ## 重要细节
         - [细节1]
         - [细节2]
         
         ## 总结
         [内容简要总结]`,

    ja: `あなたは専門的なノートテイカーです。以下の文章を構造化された学術ノートに整理してください：

         # タイトル
         
         ## 主要概念
         - [概念1]：[簡単な説明]
         - [概念2]：[簡単な説明]
         
         ## 要点
         1. [第一のポイント]
         2. [第二のポイント]
         
         ## 重要な詳細
         - [詳細1]
         - [詳細2]
         
         ## まとめ
         [内容の要約]`
  };

  // 获取系统提示，如果没有对应语言的模板，使用英语模板并要求翻译
  const getSystemPrompt = (language) => {
    if (systemPrompts[language]) {
      return `${systemPrompts[language]}

      IMPORTANT: Please generate the note ONLY in ${language} language. Do not include any other languages in your response.`;
    }
    
    // 如果没有对应语言的模板，使用英语模板并添加翻译指令
    return `${systemPrompts.en}

    IMPORTANT: Please translate the final note ONLY into ${language} language while maintaining the same structure. Do not include English or any other languages in your response.`;
  };

  try {
    const response = await fetch('https://api.siliconflow.cn/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(noteLanguage)
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.7,
        frequency_penalty: 0.5,
        n: 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Note generation API error:', errorData);
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your credentials.');
      }
      
      throw new Error(`API error: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Note generation completed successfully');
    
    const noteContent = data.choices[0].message.content;
    console.log('Generated note length:', noteContent.length);

    return noteContent;
  } catch (error) {
    console.error('Note generation error:', error);
    throw new Error('Failed to generate note: ' + error.message);
  }
};

export const saveNote = async (noteData) => {
  console.log('Saving note to database...', { 
    title: noteData.title,
    subject: noteData.subject,
    contentLength: noteData.content.length,
    transcriptLength: noteData.transcript?.length
  });

  try {
    // Format transcript if it's an object
    const formattedTranscript = typeof noteData.transcript === 'object' 
      ? JSON.stringify(noteData.transcript)
      : noteData.transcript;

    const note = {
      ...noteData,
      date: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      syncStatus: 'pending',
      transcript: formattedTranscript
    };

    const id = await db.notes.put(note);
    console.log('Note saved successfully', { noteId: id });
    
    return id;
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
}; 