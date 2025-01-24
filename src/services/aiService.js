const SILICONFLOW_API_KEY = process.env.REACT_APP_SILICONFLOW_API_KEY;

export const askQuestion = async (noteContent, question, onData) => {
  if (!noteContent || !question) {
    throw new Error('Note content and question are required.');
  }

  console.log('Starting AI interaction...', {
    noteLength: noteContent.length,
    question,
  });

  try {
    const response = await fetch(
      'https://api.siliconflow.cn/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SILICONFLOW_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-V2.5',
          messages: [
            {
              role: 'system',
              content: `You are an expert assistant. Use the provided note content to answer the question in detail.`,
            },
            { role: 'assistant', content: noteContent },
            { role: 'user', content: question },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0,
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AI Service error:', errorData);

      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your credentials.');
      }

      throw new Error(`API error: ${errorData.message || 'Unknown error'}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;

    let fullResponse = '';
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      const chunk = decoder.decode(value, { stream: true });

      //console.log('Raw chunk:', chunk);

      const lines = chunk.split('\n').filter((line) => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const json = line.substring(6);
          //console.log('Parsed JSON:', json);

          if (json === '[DONE]') {
            console.log('Stream complete. Full response:', fullResponse);
            done = true;
            break;
          }

          const parsed = JSON.parse(json);
          const content = parsed.choices[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            //console.log('Content delta:', content);
            onData(content);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
