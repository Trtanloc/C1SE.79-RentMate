import { useEffect, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/useI18n.js';

const DEFAULT_CHAT_SIZE = { width: 400, height: 550 };
const MIN_CHAT_WIDTH = 320;
const MIN_CHAT_HEIGHT = 420;
const CHAT_SIZE_STORAGE_KEY = 'rentmate-chat-size';

const ChatBox = () => {
  const { isAuthenticated } = useAuth();
  const { t, lang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [chatSize, setChatSize] = useState(DEFAULT_CHAT_SIZE);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const clampSize = (width, height) => {
    const maxWidth =
      typeof window !== 'undefined'
        ? Math.max(MIN_CHAT_WIDTH, Math.floor(window.innerWidth * 0.9))
        : Number.MAX_SAFE_INTEGER;
    const maxHeight =
      typeof window !== 'undefined'
        ? Math.max(MIN_CHAT_HEIGHT, Math.floor(window.innerHeight * 0.85))
        : Number.MAX_SAFE_INTEGER;

    return {
      width: Math.min(Math.max(width ?? DEFAULT_CHAT_SIZE.width, MIN_CHAT_WIDTH), maxWidth),
      height: Math.min(Math.max(height ?? DEFAULT_CHAT_SIZE.height, MIN_CHAT_HEIGHT), maxHeight),
    };
  };

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
  }, [messages, isOpen, chatSize]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('rentmate:chat-open', handleOpen);
    return () => window.removeEventListener('rentmate:chat-open', handleOpen);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedSize = window.localStorage.getItem(CHAT_SIZE_STORAGE_KEY);
    if (!storedSize) return;

    try {
      const parsed = JSON.parse(storedSize);
      setChatSize(clampSize(Number(parsed.width), Number(parsed.height)));
    } catch (error) {
      setChatSize(DEFAULT_CHAT_SIZE);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CHAT_SIZE_STORAGE_KEY, JSON.stringify(chatSize));
  }, [chatSize]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      setChatSize((prev) => clampSize(prev.width, prev.height));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen || !chatContainerRef.current || typeof ResizeObserver === 'undefined') return undefined;

    // Track user drag resizing so size can be persisted and clamped.
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry?.contentRect) return;

      const { width, height } = entry.contentRect;
      setChatSize((prev) => {
        const next = clampSize(Math.round(width), Math.round(height));
        if (next.width === prev.width && next.height === prev.height) {
          return prev;
        }
        return next;
      });
    });

    observer.observe(chatContainerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  const formatTime = (value) => {
    if (!value) return '';
    const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
    return new Date(value).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const resolveSender = (message) => {
    const raw = (message?.senderType || message?.role || '').toLowerCase();
    if (raw === 'tenant' || raw === 'user') return 'user';
    if (raw === 'assistant') return 'assistant';
    if (raw === 'system') return 'system';
    return 'assistant';
  };

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
      senderType: 'user',
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
        content: data?.reply ?? t('chat.processingReply', 'Your answer is being prepared, please wait.'),
        senderType: 'assistant',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setErrorMessage(
        error?.response?.data?.message ??
          t('chat.sendError', 'Unable to send your message, please try again.'),
      );
    } finally {
      setIsSending(false);
    }
  };

  const renderBubble = (message) => {
    const sender = resolveSender(message);
    const isUser = sender === 'user';
    const isAssistant = sender === 'assistant';
    const baseBubbleStyles = isUser
      ? 'bg-blue-600 text-white'
      : isAssistant
        ? 'bg-gray-50 text-gray-900 border border-gray-200'
        : 'bg-emerald-100 text-emerald-900';

    const senderLabel = isUser
      ? t('chat.sender.you', 'You')
      : isAssistant
        ? t('chat.sender.assistant', 'RentMate Assistant')
        : t('chat.sender.system', 'System');

    const timeLabel = formatTime(message.createdAt);

    return (
      <div
        key={message.id ?? `${sender}-${message.createdAt}`}
        className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${baseBubbleStyles}`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          {timeLabel ? (
            <p
              className={`mt-2 text-[11px] tracking-wide ${
                isUser ? 'text-white/80 text-right' : 'text-gray-500'
              }`}
            >
              <span className="sr-only">{senderLabel} - </span>
              {timeLabel}
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex flex-1 flex-col justify-center space-y-3">
          <p className="text-sm font-semibold text-brand">
            {t('chat.unauth.title', 'Sign in to chat with RentMate assistant.')}
          </p>
          <p className="text-xs text-gray-400">
            {t('chat.unauth.subtitle', 'Your conversation will open in the Messages tab after login.')}
          </p>
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={messagesEndRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-2 pr-1"
        >
          {messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400">
              {t('chat.emptyPrompt', 'Ask RentMate anything about rentals.')}
            </p>
          ) : (
            messages.map((message) => renderBubble(message))
          )}
        </div>
        {errorMessage && <p className="mt-2 text-xs text-red-500">{errorMessage}</p>}
        <div className="mt-3 flex shrink-0 items-center gap-2">
          <textarea
            rows={2}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={t('chat.placeholder', 'e.g. I want a 2BR under 12M VND...')}
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            aria-label={t('chat.send', 'Send')}
          >
            {isSending ? t('chat.sending', '...') : t('chat.send', 'Send')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          ref={chatContainerRef}
          className="relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
          style={{
            width: chatSize.width,
            height: chatSize.height,
            minWidth: MIN_CHAT_WIDTH,
            minHeight: MIN_CHAT_HEIGHT,
            maxWidth: '90vw',
            maxHeight: '85vh',
            resize: 'both',
          }}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 rounded-t-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
            <div>
              <p className="text-sm font-semibold">{t('chat.headerTitle', 'RentMate assistant')}</p>
              <p className="text-xs text-blue-100">
                {t('chat.headerSubtitle', 'Answers grounded in live backend data.')}
              </p>
            </div>
            <button
              type="button"
              aria-label={t('chat.closeAria', 'Close chat window')}
              className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              X
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-5 py-3">{renderContent()}</div>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setErrorMessage('');
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
        aria-label={t('chat.openAria', 'Open RentMate chat')}
      >
        AI
      </button>
    </div>
  );
};

export default ChatBox;
