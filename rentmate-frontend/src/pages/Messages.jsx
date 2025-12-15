import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const MessagesPage = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const propertyIdFromQuery = query.get('propertyId');
  const landlordIdFromQuery = query.get('landlordId');

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/conversations');
      const list = Array.isArray(data?.data) ? data.data : [];
      setConversations(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Không thể tải hội thoại';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const ensureConversationFromQuery = useCallback(async () => {
    if (!propertyIdFromQuery || !isAuthenticated || user.role !== 'tenant') {
      return;
    }
    try {
      const { data } = await axiosClient.post('/conversations', {
        propertyId: Number(propertyIdFromQuery),
        landlordId: landlordIdFromQuery ? Number(landlordIdFromQuery) : undefined,
      });
      if (data?.data?.id) {
        setSelectedId(data.data.id);
      }
    } catch (err) {
      // ignore if cannot create
    }
  }, [isAuthenticated, landlordIdFromQuery, propertyIdFromQuery, user.role]);

  const loadMessages = useCallback(async () => {
    if (!selectedId) return;
    try {
      const { data } = await axiosClient.get(`/messages/${selectedId}`);
      const payload = data?.data ?? data;
      setMessages(Array.isArray(payload) ? payload : []);
    } catch {
      setMessages([]);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    ensureConversationFromQuery().then(loadConversations);
  }, [ensureConversationFromQuery, isAuthenticated, loadConversations]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages, selectedId]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || sending || !selectedId) return;
    setSending(true);
    const optimistic = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      senderType: user.role,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInputValue('');
    try {
      await axiosClient.post('/messages', {
        conversationId: selectedId,
        content: trimmed,
        mode: 'owner',
      });
      await loadMessages();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError(err?.response?.data?.message || 'Không gửi được tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const currentConversation = conversations.find((c) => c.id === selectedId);

  const getConversationName = useCallback(
    (conversation) => {
      if (!conversation) return '';
      if (user?.role === 'tenant') {
        return (
          conversation.landlordName ||
          (conversation.landlordId ? `Chu nha #${conversation.landlordId}` : 'Chu nha')
        );
      }
      if (
        user?.role === 'landlord' ||
        user?.role === 'manager' ||
        user?.role === 'admin'
      ) {
        return (
          conversation.tenantName ||
          (conversation.tenantId ? `Khach thue #${conversation.tenantId}` : 'Khach thue')
        );
      }
      return conversation.propertyTitle || `BDS #${conversation.propertyId}`;
    },
    [user?.role],
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Messages</h1>
          <p className="text-sm text-gray-500">
            Trao đổi giữa người thuê và chủ nhà. Chat AI nằm ở widget góc phải.
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={() => navigate('/properties')}
        >
          Quay lại danh sách
        </button>
      </div>
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[280px,1fr]">
        <aside className="border-b border-gray-100 lg:border-b-0 lg:border-r">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Hội thoại
            </p>
          </div>
          {loading ? (
            <div className="px-4 pb-4 text-sm text-gray-500">Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div className="px-4 pb-4 text-sm text-gray-500">
              Chưa có hội thoại.
            </div>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`block w-full px-4 py-3 text-left text-sm transition ${
                      selectedId === c.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-semibold">{getConversationName(c)}</p>
                    <p className="text-xs text-gray-500">
                      {(c.propertyTitle || `BDS #${c.propertyId}`) ?? ""} - Cap nhat {new Date(c.updatedAt).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <div className="flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {selectedId && messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderType === 'tenant' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow ${
                        m.senderType === 'tenant'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p>{m.content}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide opacity-70">
                        {m.senderType}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                {selectedId ? 'Chưa có tin nhắn.' : 'Chọn một hội thoại để bắt đầu.'}
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 p-4">
            {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
            <div className="flex items-center gap-3">
              <textarea
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="Nhắn tin..."
              />
              <button
                type="button"
                disabled={!inputValue.trim() || sending || !selectedId}
                onClick={handleSend}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
              >
                {sending ? 'Đang gửi...' : 'Gửi'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MessagesPage;