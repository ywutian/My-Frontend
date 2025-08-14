import { CONFIG, API_ROUTES } from '../../../shared/lib/config';

interface GeminiCandidate {
  content: {
    parts: { text: string }[];
    role: string;
  };
}

interface GeminiStreamResponse {
  candidates: GeminiCandidate[];
}

export const askQuestion = async (
  noteContent: string,
  question: string,
  onData: (content: string) => void,
): Promise<void> => {
  if (!question) {
    throw new Error('Question is required.');
  }

  try {
    const systemText = noteContent
      ? 'You are an expert assistant. Use the provided note content to answer the question in detail.'
      : 'You are a helpful assistant. Answer the question in detail.';

    const userText = noteContent
      ? `Here is the note content:\n\n${noteContent}\n\nQuestion: ${question}`
      : question;

    const response = await fetch(
      `${API_ROUTES.GEMINI_STREAM}?alt=sse&key=${CONFIG.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: systemText,
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: userText,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            topP: 0.9,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);

      if (response.status === 429) {
        throw new Error('API 请求频率超限，请稍等一分钟后再试。');
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key. Please check your Gemini credentials.');
      }

      throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      const chunk = decoder.decode(value, { stream: true });

      const lines = chunk.split('\n').filter((line) => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const json = line.substring(6);

          if (json === '[DONE]') {
            done = true;
            break;
          }

          try {
            const parsed: GeminiStreamResponse = JSON.parse(json);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              onData(content);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
