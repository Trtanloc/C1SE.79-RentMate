import { useEffect, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Floating AI-only chat box. Human-to-human chat is now on /messages page.
 */
const ChatBox = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('rentmate:chat-open', handleOpen);
    return () => window.removeEventListener('rentmate:chat-open', handleOpen);
  }, []);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) {
      return;
    }
    setIsSending(true);
    setErrorMessage('');

    const optimistic = {
      id: `local-${Date.now()}`,
      content: trimmed,
      senderType: 'tenant',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInputValue('');

    try {
      const { data } = await axiosClient.post('/ai/chat', {
        message: trimmed,
      });
      const aiMessage = {
        id: `ai-${Date.now()}`,
        content: data?.reply ?? 'Trả lời đang xử lý, vui lòng chờ.',
        senderType: 'assistant',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setErrorMessage(
        error?.response?.data?.message ??
          'Không gửi được tin nhắn, vui lòng thử lại.',
      );
    } finally {
      setIsSending(false);
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
            {isTenant ? 'Bạn' : isAssistant ? 'RentMate Assistant' : 'Hệ thống'}
          </p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-brand">
            Đăng nhập để trò chuyện với trợ lý RentMate.
          </p>
          <p className="text-xs text-gray-400">
            Chat người dùng ↔ chủ nhà đã chuyển sang trang Messages.
          </p>
        </div>
      );
    }

    return (
      <>
        <div
          ref={scrollRef}
          className="flex max-h-64 flex-col gap-3 overflow-y-auto py-2"
        >
          {messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400">
              Hãy hỏi RentMate bất cứ điều gì về thuê nhà.
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
            placeholder="Ví dụ: Tôi muốn xem căn hộ 2PN dưới 12 triệu..."
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            aria-label="Gửi tin nhắn"
          >
            {isSending ? '...' : 'Gửi'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-80 rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-4 rounded-t-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
            <div>
              <p className="text-sm font-semibold">Trợ lý ảo RentMate</p>
              <p className="text-xs text-blue-100">
                Giải đáp tức thì dựa trên dữ liệu hệ thống
              </p>
            </div>
            <button
              type="button"
              aria-label="Đóng cửa sổ chat"
              className="text-blue-100 transition hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="px-5 py-3">{renderContent()}</div>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setErrorMessage('');
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
        aria-label="Mở chat RentMate"
      >
        AI
      </button>
    </div>
  );
};

export default ChatBox;
