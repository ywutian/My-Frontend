export const getTranscriptText = (transcripts, interimResult, prevInterimRef) => {
  console.log('Processing text:', {
    transcriptsCount: transcripts.length,
    transcriptTexts: transcripts.map(t => t.text),
    hasInterim: !!interimResult,
    interimText: interimResult?.text
  });

  const historicalText = transcripts.map(t => t.text).join(' ');

  let incrementalText = '';
  if (interimResult?.text) {
    incrementalText = interimResult.text;
    if (prevInterimRef.current !== incrementalText) {
      prevInterimRef.current = incrementalText;
      console.log('Interim text updated:', incrementalText);
    }
  }

  return { historicalText, incrementalText };
};
