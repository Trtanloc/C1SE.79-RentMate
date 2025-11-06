import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Send, Bot, User as UserIcon, Sparkles, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import axiosClient from '../api/axiosClient.jsx';
import { toast } from 'sonner';

const suggestedQuestions = [
  'Tìm phòng trọ giá dưới 3 triệu',
  'Căn hộ gần trường ĐH Bách Khoa',
  'Phòng có nội thất đầy đủ',
  'Ở ghép nữ Quận 1'
];

const modes = {
  assistant: {
    label: 'Trợ Lý AI',
    description: 'Gemini + dữ liệu RentMate',
    icon: Bot,
  },
  owner: {
    label: 'Chat Chủ Nhà',
    description: 'Gửi tin nhắn đến chủ nhà',
    icon: Home,
  },
};

export function AIChat() {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('assistant');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const conversationId = useMemo(() => {
    if (!user) return null;
    return `tenant-${user.id}`;
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const { data } = await axiosClient.get(`/messages/${conversationId}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      // Fallback to empty state if API fails
      setMessages([{
        id: 'welcome',
        senderType: 'assistant',
        content: 'Xin chào! Tôi là trợ lý AI của RentMate. Tôi có thể giúp bạn tìm kiếm nhà trọ phù hợp. Bạn cần tìm loại phòng nào?',
        createdAt: new Date().toISOString()
      }]);
    }
  }, [conversationId]);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadMessages();
    }
  }, [isOpen, loadMessages, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message) => {
    const trimmed = message.trim();
    if (!trimmed || !conversationId || isSending) return;

    setIsSending(true);
    
    // Optimistic update - Add user message immediately
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: user?.id,
      senderType: 'tenant',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setInputValue('');

    try {
      if (mode === 'assistant') {
        // AI Assistant mode
        const { data } = await axiosClient.post('/ai/chat', {
          message: trimmed,
        });

        const aiMessage = {
          id: `ai-${Date.now()}`,
          conversationId,
          senderType: 'assistant',
          content: data?.reply ?? 'Trợ lý AI đang xử lý, vui lòng thử lại.',
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Owner chat mode
        await axiosClient.post('/messages', {
          conversationId,
          content: trimmed,
          mode: 'owner',
        });
        toast.success('Đã gửi tin nhắn đến chủ nhà');
      }
      
      // Reload messages to get server state
      await loadMessages();
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      const errorMsg = error?.response?.data?.message ?? 'Không gửi được tin nhắn, vui lòng thử lại.';
      toast.error(errorMsg);
      
      // Fallback mock response for assistant mode
      if (mode === 'assistant') {
        setTimeout(() => {
          const mockMessage = {
            id: `mock-${Date.now()}`,
            senderType: 'assistant',
            content: `Tôi đã tìm thấy ${Math.floor(Math.random() * 50 + 10)} căn phòng phù hợp với yêu cầu "${trimmed}". Bạn muốn xem chi tiết không?`,
            createdAt: new Date().toISOString()
          };
          setMessages(prev => [...prev, mockMessage]);
        }, 800);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Only show for authenticated tenants
  if (!isAuthenticated || user?.role !== 'tenant') {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-[#0072BC] to-[#001F3F] text-white rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center z-50 animate-pulse-glow"
      >
        <MessageCircle className="w-8 h-8" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFD400] rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-[#001F3F]" />
        </div>
      </button>
    );
  }

  const ModeIcon = modes[mode].icon;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0072BC] to-[#001F3F] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ModeIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold">RentMate {modes[mode].label}</div>
            <div className="text-xs text-white/80">{modes[mode].description}</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="px-4 pt-3 pb-2 bg-white border-b">
        <div className="flex gap-2">
          {Object.keys(modes).map((key) => {
            const ModeButtonIcon = modes[key].icon;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === key
                    ? 'bg-gradient-to-r from-[#0072BC] to-[#001F3F] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ModeButtonIcon className="w-4 h-4" />
                {modes[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0072BC] to-[#001F3F] rounded-full flex items-center justify-center mb-4">
              <ModeIcon className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-gray-500 mb-2">
              {mode === 'assistant' 
                ? 'Chào bạn! Tôi sẵn sàng giúp bạn tìm nhà trọ.'
                : 'Gửi tin nhắn đầu tiên cho chủ nhà'}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isTenant = message.senderType === 'tenant';
            const isAssistant = message.senderType === 'assistant';
            const isLandlord = message.senderType === 'landlord';
            
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isTenant ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isAssistant
                    ? 'bg-gradient-to-br from-[#0072BC] to-[#001F3F]' 
                    : isLandlord
                    ? 'bg-gradient-to-br from-[#FFD400] to-[#FFA500]'
                    : 'bg-gray-300'
                }`}>
                  {isAssistant ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : isLandlord ? (
                    <Home className="w-5 h-5 text-[#001F3F]" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className={`max-w-[70%] ${isTenant ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-4 py-3 rounded-2xl ${
                    isAssistant
                      ? 'bg-white text-gray-800 border border-gray-200'
                      : isLandlord
                      ? 'bg-[#FFF9E6] text-gray-800 border border-[#FFD400]'
                      : 'bg-gradient-to-r from-[#0072BC] to-[#001F3F] text-white'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  <div className="text-xs text-gray-500 px-2 flex items-center gap-1">
                    <span className="uppercase tracking-wide opacity-70">
                      {isTenant ? 'Bạn' : isAssistant ? 'AI' : isLandlord ? 'Chủ nhà' : 'Hệ thống'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions - Only for assistant mode when no messages */}
      {mode === 'assistant' && messages.length === 0 && (
        <div className="p-4 border-t bg-white">
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-[#FFD400]" />
            Câu hỏi gợi ý:
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question)}
                disabled={isSending}
                className="px-3 py-1.5 bg-gray-100 hover:bg-[#0072BC] hover:text-white rounded-full text-xs transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage(inputValue)}
            placeholder={
              mode === 'assistant'
                ? 'Ví dụ: Tôi muốn xem căn hộ dưới 5 triệu...'
                : 'Nhắn chủ nhà về căn phòng này...'
            }
            disabled={isSending}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:border-[#0072BC] focus:ring-2 focus:ring-[#0072BC]/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isSending}
            className="w-12 h-12 bg-gradient-to-r from-[#0072BC] to-[#001F3F] text-white rounded-full flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}