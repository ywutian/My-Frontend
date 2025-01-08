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
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {message.type === 'assistant' ? (
                <ContentDisplay content={message.content} />
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none 
                       focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg 
                       hover:bg-gray-50 flex items-center gap-2"
            disabled={!inputMessage.trim()}
          >
            <FiSend />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default AiAssistant;
