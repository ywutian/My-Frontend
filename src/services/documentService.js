import * as pdfjsLib from 'pdfjs-dist';
import { generateNote } from './noteGenerationService';

// 设置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export const extractTextFromPDF = async (file) => {
  try {
    // 将文件转换为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载 PDF 文档
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // 遍历所有页面提取文本
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

export const handleDocumentUpload = async (file, documentLanguage, noteLanguage) => {
  try {
    // 检查文件类型
    if (!file.type) {
      throw new Error('File type not detected');
    }

    let text = '';

    // 根据文件类型提取文本
    if (file.type.includes('pdf')) {
      text = await extractTextFromPDF(file);
    } else if (file.type.includes('text/plain')) {
      text = await file.text();
    } else if (file.type.includes('application/vnd.openxmlformats-officedocument') ||
               file.type.includes('application/msword') ||
               file.type.includes('application/vnd.ms-excel') ||
               file.type.includes('application/vnd.ms-powerpoint')) {
      // 对于 Office 文档，可以使用专门的库来处理
      // 这里需要添加对 Office 文档的支持
      throw new Error('Office document support coming soon');
    } else {
      throw new Error('Unsupported file format');
    }
    
    if (!text) {
      throw new Error('No text could be extracted from the document');
    }

    // 使用 AI 生成笔记
    const content = await generateNote(text, {
      sourceLanguage: documentLanguage,
      targetLanguage: noteLanguage
    });

    // 从文件名生成标题（移除文件扩展名）
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
        uploadDate: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

// 支持的文件类型检查
export const isSupportedFileType = (file) => {
  const supportedTypes = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'text/csv'
  ];

  return supportedTypes.includes(file.type);
};

// 获取文件大小限制
export const getFileSizeLimit = () => {
  return 50 * 1024 * 1024; // 50MB
};

// 检查文件大小
export const isFileSizeValid = (file) => {
  return file.size <= getFileSizeLimit();
};

// 文件验证
export const validateFile = (file) => {
  if (!isSupportedFileType(file)) {
    throw new Error('Unsupported file type');
  }

  if (!isFileSizeValid(file)) {
    throw new Error('File size exceeds limit (50MB)');
  }

  return true;
}; 