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

export const handleDocumentUpload = async (file, language) => {
  try {
    // 检查文件类型
    if (!file.type.includes('pdf')) {
      throw new Error('Only PDF files are supported at the moment');
    }

    // 1. 提取文本
    const text = await extractTextFromPDF(file);
    
    if (!text) {
      throw new Error('No text could be extracted from the PDF');
    }
    
    // 2. 使用 AI 生成笔记
    const content = await generateNote(text, language);

    // 3. 从文件名生成标题（移除.pdf后缀）
    const title = file.name.replace('.pdf', '');
    
    return {
      content,
      title,
      originalText: text // 保存原始文本以供将来参考
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}; 