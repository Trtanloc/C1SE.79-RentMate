import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const modes = {
  assistant: {
    label: 'Hỏi trợ lý AI',
    description: 'Gemini + dữ liệu RentMate',
  },
  owner: {
    label: 'Chat với Chủ nhà',
    description: 'Gửi tin nhắn đến chủ nhà',
  },
};

const ChatBox = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('assistant');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const scrollRef = useRef(null);

  const conversationId = useMemo(() => {
    if (!user) {
      return null;
    }
    return `tenant-${user.id}`;
  }, [user]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      return;
    }
    try {
      const { data } = await axiosClient.get(`/messages/${conversationId}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage('Không thể tải lịch sử chat. Vui lòng thử lại.');
    }
  }, [conversationId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    loadMessages();
  }, [isOpen, loadMessages]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  if (!isAuthenticated || user?.role !== 'tenant') {
    return null;
  }

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !conversationId || isSending) {
      return;
    }

    setIsSending(true);
    setErrorMessage('');

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: user.id,
      senderType: 'tenant',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setInputValue('');

    try {
      if (mode === 'assistant') {
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
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        await axiosClient.post('/messages', {
          conversationId,
          content: trimmed,
          mode: 'owner',
        });
      }
      await loadMessages();
    } catch (error) {
      setMessages((prev) =>
        prev.filter((message) => message.id !== optimisticMessage.id),
      );
      setErrorMessage(
        error?.response?.data?.message ??
          'Không gửi được tin nhắn, vui lòng thử lại.',
      );
    } finally {
      setIsSending(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (isOpen === true) {
      setErrorMessage('');
    }
  };

  const renderBubble = (message) => {
    const isTenant = message.senderType === 'tenant';
    const isAssistant = message.senderType === 'assistant';
    const baseBubbleStyles = isTenant
      ? 'bg-blue-600 text-white self-end rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
      : isAssistant
        ? 'bg-white text-gray-900 border border-gray-200 self-start rounded-tr-2xl rounded-br-2xl rounded-tl-2xl'
        : 'bg-emerald-100 text-emerald-900 self-start rounded-xl';

    return (
      <div key={message.id ?? `${message.senderType}-${message.createdAt}`}>
        <div
          className={`max-w-[85%] px-4 py-2 text-sm shadow-sm ${baseBubbleStyles}`}
        >
          <p className="leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wide opacity-65">
            {isTenant
              ? 'Bạn'
              : isAssistant
                ? 'RentMate Assistant'
                : 'Hệ thống'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-80 rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-4 rounded-t-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
            <div>
              <p className="text-sm font-semibold">RentMate Virtual Assistant</p>
              <p className="text-xs text-blue-100">
                {modes[mode].description}
              </p>
            </div>
            <button
              type="button"
              aria-label="Đóng cửa sổ chat"
              className="text-blue-100 transition hover:text-white"
              onClick={toggleOpen}
            >
              ✕
            </button>
          </div>
          <div className="px-5 py-3">
            <div className="mb-3 flex gap-2">
              {Object.entries(modes).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  className={`flex-1 rounded-full border px-2 py-1 text-xs font-semibold transition ${
                    mode === key
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-blue-200'
                  }`}
                  onClick={() => setMode(key)}
                >
                  {value.label}
                </button>
              ))}
            </div>
            <div
              ref={scrollRef}
              className="flex max-h-64 flex-col gap-3 overflow-y-auto py-2"
            >
              {messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400">
                  Hãy gửi tin nhắn đầu tiên cho RentMate nhé!
                </p>
              ) : (
                messages.map((message) => renderBubble(message))
              )}
            </div>
            {errorMessage && (
              <p className="mt-2 text-xs text-red-500">{errorMessage}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <textarea
                rows={2}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={
                  mode === 'assistant'
                    ? 'Ví dụ: Tôi muốn xem căn hộ dưới 5 triệu...'
                    : 'Nhắn chủ nhà rằng...'
                }
                className="flex-1 resize-none rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                aria-label="Gửi tin nhắn"
              >
                {isSending ? '…' : '➤'}
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={toggleOpen}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
        aria-label="Mở chat RentMate"
      >
        💬
      </button>
    </div>
  );
};

export default ChatBox;
