import * as pdfjsLib from 'pdfjs-dist';
import { generateNote } from '../../notes/services/noteGenerationService';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

interface DocumentResult {
  content: string;
  title: string;
  originalText: string;
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    documentLanguage: string;
    noteLanguage: string;
    uploadDate: string;
  };
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

export const handleDocumentUpload = async (
  file: File,
  documentLanguage: string,
  noteLanguage: string,
): Promise<DocumentResult> => {
  try {
    if (!file.type) {
      throw new Error('File type not detected');
    }

    let text = '';

    if (file.type.includes('pdf')) {
      text = await extractTextFromPDF(file);
    } else if (file.type.includes('text/plain')) {
      text = await file.text();
    } else if (
      file.type.includes('application/vnd.openxmlformats-officedocument') ||
      file.type.includes('application/msword') ||
      file.type.includes('application/vnd.ms-excel') ||
      file.type.includes('application/vnd.ms-powerpoint')
    ) {
      throw new Error('Office document support coming soon');
    } else {
      throw new Error('Unsupported file format');
    }

    if (!text) {
      throw new Error('No text could be extracted from the document');
    }

    const content = await generateNote(text, noteLanguage);
    const title = file.name.replace(/\.[^/.]+$/, '');

    return {
      content,
      title,
      originalText: text,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentLanguage,
        noteLanguage,
        uploadDate: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

const SUPPORTED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/csv',
];

export const isSupportedFileType = (file: File): boolean => {
  return SUPPORTED_TYPES.includes(file.type);
};

export const getFileSizeLimit = (): number => {
  return 50 * 1024 * 1024; // 50MB
};

export const isFileSizeValid = (file: File): boolean => {
  return file.size <= getFileSizeLimit();
};

export const validateFile = (file: File): boolean => {
  if (!isSupportedFileType(file)) {
    throw new Error('Unsupported file type');
  }

  if (!isFileSizeValid(file)) {
    throw new Error('File size exceeds limit (50MB)');
  }

  return true;
};
