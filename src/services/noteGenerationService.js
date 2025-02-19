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
    en: `You are a professional note taker. Create a well-structured academic note in Markdown format. Follow these STRICT formatting rules:

1. Use proper Markdown syntax with no extra spaces between sections
2. Each section must be properly nested under its heading
3. Use consistent formatting for lists and sub-lists
4. Format the note exactly as follows:

# [Title]

## Overview
[A concise 2-3 sentence introduction about the topic]

## Key Concepts
- **[Key Term 1]**: [Clear, concise definition]
- **[Key Term 2]**: [Clear, concise definition]

## Main Points
1. [First Main Point]
   - [Supporting detail]
   - [Example or evidence]
2. [Second Main Point]
   - [Supporting detail]
   - [Example or evidence]

## Important Details
- [Specific detail 1]
- [Specific detail 2]

## Summary
[A brief 2-3 sentence conclusion]

## References
- [Reference 1]
- [Reference 2]

IMPORTANT: 
- Maintain consistent indentation
- Use proper Markdown syntax
- Ensure all sections are present and properly formatted
- Do not include placeholder text like [Title] - replace with actual content
- Do not include these instructions in the output`,

    zh: `你是一位专业的笔记整理者。请使用Markdown格式创建结构化的笔记。严格遵循以下格式规则：

1. 使用正确的Markdown语法，段落之间不要有多余的空行
2. 每个部分都必须正确嵌套在其标题下
3. 使用统一的列表和子列表格式
4. 严格按照以下格式输出：

# [标题]

## 概述
[简明扼要的2-3句话介绍主题内容]

## 核心概念
- **[关键术语1]**：[清晰简洁的定义]
- **[关键术语2]**：[清晰简洁的定义]

## 主要观点
1. [第一个主要观点]
   - [支持细节]
   - [示例或证据]
2. [第二个主要观点]
   - [支持细节]
   - [示例或证据]

## 重要细节
- [具体细节1]
- [具体细节2]

## 总结
[2-3句话的简要总结]

## 参考资料
- [参考资料1]
- [参考资料2]

重要提示：
- 保持一致的缩进
- 使用正确的Markdown语法
- 确保所有部分都存在且格式正确
- 不要包含像[标题]这样的占位符文本 - 替换为实际内容
- 不要在输出中包含这些说明`,

    ja: `あなたは専門的なノートテイカーです。Markdown形式で構造化されたノートを作成してください。以下の形式規則を厳守してください：

1. 正しいMarkdown構文を使用し、セクション間に余分な空行を入れない
2. 各セクションは見出しの下に正しくネストする
3. リストとサブリストに一貫した書式を使用
4. 以下の形式に厳密に従って出力：

# [タイトル]

## 概要
[トピックについての簡潔な2-3文の説明]

## 主要概念
- **[キーワード1]**：[明確で簡潔な定義]
- **[キーワード2]**：[明確で簡潔な定義]

## 要点
1. [第一の要点]
   - [補足説明]
   - [例示または証拠]
2. [第二の要点]
   - [補足説明]
   - [例示または証拠]

## 重要な詳細
- [具体的な詳細1]
- [具体的な詳細2]

## まとめ
[2-3文の簡潔なまとめ]

## 参考資料
- [参考資料1]
- [参考資料2]

重要な注意事項：
- 一貫したインデントを維持
- 正しいMarkdown構文を使用
- すべてのセクションが存在し、正しく書式設定されていることを確認
- [タイトル]などのプレースホルダーテキストは実際の内容に置き換える
- これらの指示を出力に含めない`
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
        model: 'deepseek-ai/DeepSeek-V2.5',
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