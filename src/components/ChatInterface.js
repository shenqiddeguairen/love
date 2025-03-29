import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SmileOutlined, LoadingOutlined } from '@ant-design/icons';
import '../styles/ChatInterface.css';

const ChatInterface = ({ cardId, onAIResponseUpdate }) => {
  const [inputText, setInputText] = useState('');

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem(`chat_messages_${cardId}`);
    const savedContext = localStorage.getItem(`chat_context_${cardId}`);
    if (savedMessages && savedContext) {
      return JSON.parse(savedMessages);
    }
    return [];
  });

  // 检查是否有新添加的矛盾信息
  const [hasAutoSent, setHasAutoSent] = useState(false);

  useEffect(() => {
    const conflictData = localStorage.getItem(`conflict_${cardId}`);
    if (conflictData && !hasAutoSent) {
      const { issue, description } = JSON.parse(conflictData);
      const message = `我们最近遇到了一个情侣之间的矛盾，因为${issue}${description ? `\n具体情况是：${description}` : ''}\n请给我一些建议。`;
      setInputText(message);
      setHasAutoSent(true);
    }
  }, [cardId, hasAutoSent]);

  useEffect(() => {
    if (inputText && hasAutoSent) {
      handleSendMessage();
      // 清除已使用的矛盾信息
      localStorage.removeItem(`conflict_${cardId}`);
      setHasAutoSent(false);
    }
  }, [inputText, hasAutoSent, cardId]);

  const [chatContext, setChatContext] = useState(() => {
    const savedContext = localStorage.getItem(`chat_context_${cardId}`);
    return savedContext ? JSON.parse(savedContext) : {
      history: [],
      lastUpdated: Date.now()
    };
  });
  const [conflict, setConflict] = useState(null);
  const [accumulatedText, setAccumulatedText] = useState('');
  const [previousText, setPreviousText] = useState('');
  const [aiMessageId, setAiMessageId] = useState(null);

  // 当消息更新时保存到localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_messages_${cardId}`, JSON.stringify(messages));
      // 更新上下文信息
      const newContext = {
        history: messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
          timestamp: msg.id
        })),
        lastUpdated: Date.now()
      };
      setChatContext(newContext);
      localStorage.setItem(`chat_context_${cardId}`, JSON.stringify(newContext));
    }
  }, [messages, cardId]);
  
  // 监听accumulatedText的变化，更新消息显示
  useEffect(() => {
    if (aiMessageId && accumulatedText) {
      setPreviousText(accumulatedText);
      setMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== aiMessageId);
        return [...newMessages, {
          id: aiMessageId,
          text: previousText,
          sender: 'ai'
        }];
      });
      if (onAIResponseUpdate) {
        onAIResponseUpdate(previousText);
      }
    }
  }, [accumulatedText, aiMessageId, previousText, onAIResponseUpdate]);

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (inputText.trim()) {
      const newMessageId = Date.now();
      setMessages(prev => [...prev, {
        id: newMessageId,
        text: inputText,
        sender: 'user'
      }]);
      setInputText('');
      setIsTyping(true);
    }
  }, [inputText]);

  useEffect(() => {
    if (inputText && hasAutoSent) {
      handleSendMessage();
      localStorage.removeItem(`conflict_${cardId}`);
      setHasAutoSent(false);
    }
  }, [inputText, hasAutoSent, cardId, handleSendMessage]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="chat-title">AI情感顾问</div>
        <div className="emotion-indicator">
          <SmileOutlined /> 平和
        </div>
      </div>
      <div className="chat-background"></div>

      <div className="messages-container">
        {messages.map(message => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-content">{message.text}</div>
          </div>
        ))}
        {isTyping && (
          <div className="typing-indicator">
            <LoadingOutlined /> AI正在思考...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="说说你的想法..."
          rows="1"
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;