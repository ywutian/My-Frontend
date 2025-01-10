const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY;

export const deepgramService = {
  async transcribeAudio(audioBlob, language = 'en') {
    try {
      console.log('Starting Deepgram transcription...');

      // 设置 Deepgram API 参数
      const params = new URLSearchParams({
        model: 'nova-2',
        smart_format: 'true',
        language: language,
        punctuate: 'true',
        utterances: 'true'
      });

      const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/mp3'
        },
        body: audioBlob
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Transcription failed');
      }

      const result = await response.json();
      
      return {
        transcription: result.results?.channels[0]?.alternatives[0]?.transcript,
        confidence: result.results?.channels[0]?.alternatives[0]?.confidence,
        duration: result.metadata?.duration
      };

    } catch (error) {
      console.error('Deepgram transcription error:', error);
      throw error;
    }
  }
}; 