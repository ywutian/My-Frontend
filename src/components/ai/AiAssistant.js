import React, { useRef, useState, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import { askQuestion } from '../../services/aiService';
import ContentDisplay from './ContentDisplay';

function AiAssistant({
  noteContent,
  initialMessages = [
    {
      id: 1,
      type: 'assistant',
      content:
        'Hi! I can help you analyze this note. What would you like to know?',
    },
  ],
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
    };
    const aiMessage = {
      id: messages.length + 2,
      type: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInputMessage('');

    try {
      await askQuestion(noteContent, inputMessage, (chunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessage.id
              ? { ...msg, content: msg.content + chunk }
              : msg,
          ),
        );
      });
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessage.id
            ? {
                ...msg,
                content:
                  'Sorry, I encountered an error while processing your request.',
              }
            : msg,
        ),
      );
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[95vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 ">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-gray-100 text-gray-800 text-sm'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {message.type === 'assistant' ? (
                <ContentDisplay content={message.content} />
              ) : (
                <span className="text-sm">{message.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg 
                     focus:outline-none focus:border-blue-300 focus:ring-1 
                     focus:ring-blue-300 placeholder:text-gray-400 
                     placeholder:text-sm"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 
                     rounded-lg hover:bg-gray-50 flex items-center gap-1.5 
                     text-sm transition-colors duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     group"
            disabled={!inputMessage.trim()}
          >
            <FiSend className="w-3.5 h-3.5 group-hover:text-blue-500 
                            transition-colors duration-200" />
            <span className="group-hover:text-blue-500">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AiAssistant;
