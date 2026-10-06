import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, ConciergeBell } from 'lucide-react';
import { http, API_BASE } from './services/http';
import { isStaff } from './config/access';
import { apiError } from './utils/api';

// ── Types matching the chambre-service API ───────────────────────────────────

type ChatMessage = {
  id: number;
  content: string;
  state: 'SENT' | 'SEEN';
  senderId: string;
  receiverId: string;
  createdDate: string;
};

type Conversation = {
  id: string;
  guestId: string;
  guestName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unread: number;
};

const API = `${API_BASE}/api/chats`;
const RECEPTION = 'reception';
/** New messages show up within this delay; simpler and safer than an open socket. */
const POLL_MS = 5000;

// ── Helpers ───────────────────────────────────────────────────────────────────

const hashHue = (s: string) =>
  Math.abs(s.split('').reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0)) % 360;

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const Avatar: React.FC<{ seed: string; label: string; size?: number }> = ({ seed, label, size = 40 }) => (
  <div
    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold flex-shrink-0"
    style={{ width: size, height: size, background: `hsl(${hashHue(seed)}, 40%, 40%)`, fontSize: size * 0.36 }}
  >
    {initials(label)}
  </div>
);

const ReceptionAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <div
    className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
    style={{ width: size, height: size, background: 'var(--bs-dark)' }}
  >
    <ConciergeBell size={size * 0.45} />
  </div>
);

const time = (d?: string) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

const shortDate = (d?: string) => {
  if (!d) return '';
  const date = new Date(d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return time(d);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const dayLabel = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

const guestLabel = (c: Conversation) => c.guestName?.trim() || 'Client';

// ── Thread (shared by guest and staff views) ─────────────────────────────────

const Thread: React.FC<{
  messages: ChatMessage[];
  mySide: string;                       // guest id for a guest, "reception" for staff
  otherName: string;
  emptyHint: string;
  onSend: (text: string) => Promise<void>;
}> = ({ messages, mySide, otherName, emptyHint, onSend }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true); setError('');
    try { await onSend(content); setText(''); }
    catch (e) { setError(apiError(e, "Le message n'a pas pu être envoyé.")); }
    finally { setSending(false); }
  };

  return (
    <>
      <div className="flex-grow-1 overflow-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="text-center text-muted small py-5">{emptyHint}</div>
        )}
        {messages.map((msg, idx) => {
          const mine = msg.senderId === mySide;
          const prev = messages[idx - 1];
          const newDay = !prev || new Date(prev.createdDate).toDateString() !== new Date(msg.createdDate).toDateString();
          return (
            <React.Fragment key={msg.id}>
              {newDay && (
                <div className="text-center my-3">
                  <small className="text-muted px-3 py-1 rounded-pill border bg-white" style={{ fontSize: '0.7rem' }}>
                    {dayLabel(msg.createdDate)}
                  </small>
                </div>
              )}
              <div className={`d-flex mb-2 ${mine ? 'justify-content-end' : 'justify-content-start'}`}>
                <div
                  className={`rounded-3 px-3 py-2 ${mine ? 'bg-dark text-white ms-5' : 'bg-white text-dark me-5 border'}`}
                  style={{ maxWidth: '65%', wordBreak: 'break-word' }}
                >
                  {!mine && <div className="fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>{otherName}</div>}
                  <span style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{msg.content}</span>
                  <div className={`text-end mt-1 ${mine ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>
                    {time(msg.createdDate)}
                    {mine && <span className="ms-1">{msg.state === 'SEEN' ? '· Lu' : '· Envoyé'}</span>}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="bg-white border-top px-4 py-3 flex-shrink-0">
        {error && <div className="text-danger small mb-2">{error}</div>}
        <div className="d-flex align-items-end gap-2">
          <textarea
            className="form-control bg-light rounded-3"
            rows={2}
            maxLength={2000}
            placeholder="Écrire un message… (Entrée pour envoyer, Maj+Entrée pour un retour à la ligne)"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            style={{ resize: 'none' }}
          />
          <button
            className="btn btn-dark d-flex align-items-center gap-2 flex-shrink-0"
            onClick={send}
            disabled={!text.trim() || sending}
          >
            {sending ? <span className="spinner-border spinner-border-sm" /> : <Send size={15} />}
            Envoyer
          </button>
        </div>
      </div>
    </>
  );
};

// ── Shared loading of one conversation's messages ─────────────────────────────

function useThread(chatId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const load = useCallback(async () => {
    if (!chatId) { setMessages([]); return; }
    const res = await http.get<ChatMessage[]>(`${API}/${chatId}/messages`);
    setMessages([...res.data].reverse()); // API returns newest first
    // Reading the thread marks what was received as seen
    if (res.data.some(m => m.state !== 'SEEN')) http.put(`${API}/${chatId}/read`).catch(() => {});
  }, [chatId]);

  useEffect(() => { setMessages([]); load().catch(() => {}); }, [load]);
  return { messages, reload: load };
}

function usePolling(fn: () => Promise<unknown>) {
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) fn().catch(() => {}); }, POLL_MS);
    return () => clearInterval(id);
  }, [fn]);
}

// ── Guest view: one conversation with the reception ──────────────────────────

const GuestMessages: React.FC = () => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { messages, reload } = useThread(conversation?.id ?? null);

  const loadConversation = useCallback(async () => {
    const res = await http.get<Conversation | ''>(`${API}/mine`);
    setConversation(res.status === 204 || !res.data ? null : res.data);
  }, []);

  useEffect(() => {
    loadConversation()
      .catch(e => setError(apiError(e, 'Impossible de charger vos messages.')))
      .finally(() => setLoading(false));
  }, [loadConversation]);

  const poll = useCallback(async () => { if (conversation) await reload(); else await loadConversation(); },
    [conversation, reload, loadConversation]);
  usePolling(poll);

  const send = async (content: string) => {
    await http.post(`${API}/messages`, conversation ? { chatId: conversation.id, content } : { content });
    if (conversation) await reload(); else await loadConversation();
  };

  return (
    <div className="container py-4" style={{ maxWidth: 860 }}>
      <div className="mb-3">
        <h2 className="h4 fw-bold mb-1">Messages</h2>
        <p className="text-muted mb-0">
          Une question sur votre séjour ? La réception vous répond ici, en général dans l'heure.
        </p>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card border shadow-sm d-flex flex-column overflow-hidden" style={{ height: 'calc(100vh - 230px)', minHeight: 420 }}>
        <div className="bg-white border-bottom px-4 py-3 d-flex align-items-center gap-3 flex-shrink-0">
          <ReceptionAvatar />
          <div>
            <div className="fw-semibold">La réception</div>
            <div className="text-muted small">Royal Tulip Korbous Bay · 24 h/24</div>
          </div>
        </div>
        <div className="d-flex flex-column flex-grow-1 bg-light overflow-hidden">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center flex-grow-1">
              <span className="spinner-border spinner-border-sm text-secondary" />
            </div>
          ) : (
            <Thread
              messages={messages}
              mySide={conversation?.guestId ?? '__me__'}
              otherName="Réception"
              emptyHint="Écrivez votre premier message : demande particulière, heure d'arrivée, transfert…"
              onSend={send}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Staff view: the shared reception inbox ───────────────────────────────────

const ReceptionInbox: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { messages, reload } = useThread(selectedId);
  const selected = conversations.find(c => c.id === selectedId) ?? null;

  const loadInbox = useCallback(async () => {
    const res = await http.get<Conversation[]>(`${API}/reception`);
    setConversations(res.data);
  }, []);

  useEffect(() => {
    loadInbox()
      .catch(e => setError(apiError(e, 'Impossible de charger la boîte de réception.')))
      .finally(() => setLoading(false));
  }, [loadInbox]);

  const poll = useCallback(async () => { await Promise.all([loadInbox(), selectedId ? reload() : null]); },
    [loadInbox, reload, selectedId]);
  usePolling(poll);

  const open = (id: string) => {
    setSelectedId(id);
    // The unread badge clears as soon as the thread is opened
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const send = async (content: string) => {
    if (!selectedId) return;
    await http.post(`${API}/messages`, { chatId: selectedId, content });
    await Promise.all([reload(), loadInbox()]);
  };

  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);

  return (
    <div className="container-fluid p-0" style={{ height: 'calc(100vh - 62px)' }}>
      <div className="row g-0 h-100">
        <div className="col-lg-3 col-md-4 bg-white border-end d-flex flex-column h-100">
          <div className="px-3 py-3 border-bottom flex-shrink-0">
            <h2 className="h5 fw-bold mb-0">Messages clients</h2>
            <span className="small text-muted">
              Boîte de la réception{totalUnread > 0 && ` · ${totalUnread} non lu${totalUnread > 1 ? 's' : ''}`}
            </span>
          </div>
          {error && <div className="alert alert-danger m-3 small">{error}</div>}
          <div className="flex-grow-1 overflow-auto">
            {loading ? (
              <div className="text-center p-4"><span className="spinner-border spinner-border-sm text-secondary" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-muted p-5">
                <MessageSquare size={32} className="mb-2 opacity-25" />
                <p className="small mb-0">Aucun message de client pour l'instant.</p>
              </div>
            ) : conversations.map(c => (
              <button
                key={c.id}
                type="button"
                className={`d-flex align-items-center gap-3 px-3 py-3 border-0 border-bottom w-100 text-start ${c.id === selectedId ? 'bg-light' : 'bg-white'}`}
                onClick={() => open(c.id)}
              >
                <Avatar seed={c.guestId} label={guestLabel(c)} size={42} />
                <div className="flex-grow-1 overflow-hidden">
                  <div className="d-flex justify-content-between align-items-baseline">
                    <span className={`small text-truncate ${c.unread ? 'fw-bold' : 'fw-semibold'}`}>{guestLabel(c)}</span>
                    <span className="text-muted ms-1 flex-shrink-0" style={{ fontSize: '0.7rem' }}>{shortDate(c.lastMessageAt)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center gap-2">
                    <span className={`text-truncate ${c.unread ? 'text-dark' : 'text-muted'}`} style={{ fontSize: '0.8rem' }}>
                      {c.lastMessage}
                    </span>
                    {c.unread > 0 && <span className="badge rounded-pill text-bg-dark flex-shrink-0">{c.unread}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-lg-9 col-md-8 d-flex flex-column h-100 bg-light">
          {!selected ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
              <MessageSquare size={44} className="mb-3 opacity-25" />
              <p className="mb-1 fw-semibold">Sélectionnez une conversation</p>
              <p className="small mb-0">Vos réponses sont signées « Réception ».</p>
            </div>
          ) : (<>
            <div className="bg-white border-bottom px-4 py-3 d-flex align-items-center gap-3 flex-shrink-0">
              <Avatar seed={selected.guestId} label={guestLabel(selected)} size={40} />
              <div className="fw-semibold">{guestLabel(selected)}</div>
            </div>
            <Thread
              messages={messages}
              mySide={RECEPTION}
              otherName={guestLabel(selected)}
              emptyHint="Aucun message."
              onSend={send}
            />
          </>)}
        </div>
      </div>
    </div>
  );
};

export const MessagesPage: React.FC = () => (isStaff() ? <ReceptionInbox /> : <GuestMessages />);
