import React, { useState, useRef, useEffect } from 'react';
import { SendOutlined, SmileOutlined, LoadingOutlined } from '@ant-design/icons';
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
        const aiMessage = {
          id: aiMessageId,
          text: previousText,
          sender: 'ai'
        };
        if (onAIResponseUpdate) {
          onAIResponseUpdate(previousText);
        }
        const newMessages = prev.filter(msg => msg.id !== aiMessageId);
        return [...newMessages, {
          id: aiMessageId,
          text: previousText, // 使用上一次的文本，忽略最后一次输出
          sender: 'ai'
        }];
      });
    }
  }, [accumulatedText, aiMessageId]);

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setAccumulatedText(''); // 重置累积文本

    try {
      const response = await fetch('https://api.coze.cn/v3/chat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pat_itNxi2PHGiFpMLQjui8mgdlxumkA3pBNT2aMsAtxhP0A2VHvBBsaMytyZpBgragV',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot_id: '7486395199090933797',
          user_id: '3208801137213140',
          stream: true,
          auto_save_history: true,
          additional_messages: [...chatContext.history.map(msg => ({
            role: msg.role,
            content: msg.content,
            content_type: 'text'
          })), {
            role: 'user',
            content: inputText,
            content_type: 'text'
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`网络响应异常: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const newMessageId = Date.now();
      setAiMessageId(newMessageId);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const text = line.slice(5).trim();
            if (text) {
              try {
                const jsonData = JSON.parse(text);
                if (jsonData.type === 'answer') {
                  const content = jsonData.content || '';
                  setAccumulatedText(prev => prev + content);
                }
              } catch (e) {
                console.error('JSON解析错误:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      const aiMessage = {
        id: Date.now(),
        text: `抱歉，${error.message || '发送消息时出现错误'}`,
        sender: 'ai'
      };
      setMessages(prev => [...prev, aiMessage]);
      if (onAIResponseUpdate) {
        onAIResponseUpdate(aiMessage.text);
      }
    } finally {
      setIsTyping(false);
    }
  };

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