export const getTranscriptText = (
  transcripts,
  interimResult,
  prevInterimRef,
) => {
  const historical = transcripts.map((t) => t.text).join(' ');

  if (!interimResult) {
    prevInterimRef.current = '';
    return { historicalText: historical, incrementalText: '' };
  }

  const currentText = interimResult.text;
  const prevText = prevInterimRef.current;

  let newIncrement = '';
  if (currentText.startsWith(prevText)) {
    newIncrement = currentText.slice(prevText.length);
  } else {
    newIncrement = currentText;
  }

  prevInterimRef.current = currentText;

  return {
    historicalText: historical,
    incrementalText: newIncrement.trim(),
  };
};
