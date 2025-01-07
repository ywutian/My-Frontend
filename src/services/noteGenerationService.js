import { db } from '../db/db';
const SILICONFLOW_API_KEY = process.env.REACT_APP_SILICONFLOW_API_KEY;

export const generateNote = async (transcript, noteLanguage) => {
  console.log('Starting note generation...', { 
    transcriptLength: transcript.length,
    targetLanguage: noteLanguage 
  });

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
            content: `You are a professional note taker. Create a well-structured academic note from the following transcript. 
                     The note should be in ${noteLanguage} and follow this format:
                     
                     # Title
                     
                     - Instructor: [Name]
                     - Course: [Course Name]
                     - Format Change: [Any format/structure changes]
                     
                     ## Key Concepts
                     - [Concept 1]: [Brief explanation]
                     - [Concept 2]: [Brief explanation]
                     
                     ## Examples
                     - [Example 1]
                     - [Example 2]
                     
                     ## Important Details
                     - [Detail 1]
                     - [Detail 2]
                     
                     ## Notes
                     [Additional important information or context]
                     
                     Please maintain this structure while organizing the content logically.`
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