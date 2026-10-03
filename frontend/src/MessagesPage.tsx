import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus, MessageSquare, X } from 'lucide-react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import keycloak from './config/keycloak';

// ── Types matching backend entities ──────────────────────────────────────────

type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
type MessageState = 'SENT' | 'SEEN';

type ChatMessage = {
  id: number;
  content: string;
  state: MessageState;
  type: MessageType;
  senderId: string;
  receiverId: string;
  mediaFilePath?: string;
  createdDate: string;
};

type Chat = {
  id: string;           // UUID
  senderId: string;
  recipientId: string;
  lastMessage?: string;
  lastMessageTime?: string;
  createdDate: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const GATEWAY = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const WS_URL  = `${GATEWAY}/ws-chat`;   // routed through gateway → chambre-service

// ── Helpers ───────────────────────────────────────────────────────────────────

const authHeader = () => ({ headers: { Authorization: `Bearer ${keycloak.token}` } });

/** Deterministic hue from a string so every user has a consistent colour */
const hashHue = (s: string) =>
  Math.abs(s.split('').reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0)) % 360;

const Avatar: React.FC<{ id: string; size?: number }> = ({ id, size = 40 }) => (
  <div
    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
    style={{
      width: size, height: size,
      background: `hsl(${hashHue(id)}, 55%, 42%)`,
      fontSize: size * 0.36,
    }}
  >
    {id.slice(0, 2).toUpperCase()}
  </div>
);

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

const fmtDate = (d?: string) => {
  if (!d) return '';
  const date = new Date(d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return fmt(d);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const dayLabel = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

// ── Component ─────────────────────────────────────────────────────────────────

export const MessagesPage: React.FC = () => {
  const currentUserId: string = keycloak.tokenParsed?.sub ?? '';

  const [chats, setChats]               = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [inputText, setInputText]       = useState('');
  const [connected, setConnected]       = useState(false);
  const [showNewChat, setShowNewChat]   = useState(false);
  const [recipientId, setRecipientId]   = useState('');
  const [creating, setCreating]         = useState(false);
  const [createError, setCreateError]   = useState('');

  const stompRef         = useRef<Client | null>(null);
  const messagesEndRef   = useRef<HTMLDivElement>(null);
  const selectedChatRef  = useRef<Chat | null>(null);
  selectedChatRef.current = selectedChat;

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadChats = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await axios.get<Chat[]>(`${GATEWAY}/api/chats/user/${currentUserId}`, authHeader());
      setChats(res.data);
    } catch { /* silent — shown via connection status */ }
  }, [currentUserId]);

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const res = await axios.get<ChatMessage[]>(`${GATEWAY}/api/chats/${chatId}/messages`, authHeader());
      setMessages([...res.data].reverse()); // API returns DESC; display ASC
    } catch { /* silent */ }
  }, []);

  // ── WebSocket ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!currentUserId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);

        client.subscribe(`/topic/messages/${currentUserId}`, (frame: IMessage) => {
          const msg: ChatMessage = JSON.parse(frame.body);
          const selected = selectedChatRef.current;

          if (selected) {
            const other = selected.senderId === currentUserId
              ? selected.recipientId : selected.senderId;
            const belongsHere =
              (msg.senderId === currentUserId && msg.receiverId === other) ||
              (msg.senderId === other          && msg.receiverId === currentUserId);

            if (belongsHere) {
              setMessages(prev => {
                // Deduplicate by id (optimistic sends can arrive twice)
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
            }
          }

          // Refresh chat list to update lastMessage / unread indicators
          loadChats();
        });
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    stompRef.current = client;

    return () => { client.deactivate(); };
  }, [currentUserId, loadChats]);

  // ── Side effects ───────────────────────────────────────────────────────────

  useEffect(() => { loadChats(); }, [loadChats]);

  useEffect(() => {
    if (selectedChat) { setMessages([]); loadMessages(selectedChat.id); }
    else setMessages([]);
  }, [selectedChat, loadMessages]);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const otherUser = (chat: Chat) =>
    chat.senderId === currentUserId ? chat.recipientId : chat.senderId;

  const sendMessage = () => {
    if (!inputText.trim() || !selectedChat || !stompRef.current?.connected) return;
    stompRef.current.publish({
      destination: '/app/chat',
      body: JSON.stringify({
        chatId:     selectedChat.id,
        senderId:   currentUserId,
        receiverId: otherUser(selectedChat),
        content:    inputText.trim(),
        type:       'TEXT',
      }),
    });
    setInputText('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startChat = async () => {
    const target = recipientId.trim();
    if (!target || !currentUserId) return;
    if (target === currentUserId) { setCreateError('Vous ne pouvez pas vous écrire à vous-même.'); return; }

    setCreating(true); setCreateError('');
    try {
      const res = await axios.post<Chat>(
        `${GATEWAY}/api/chats/create?senderId=${encodeURIComponent(currentUserId)}&recipientId=${encodeURIComponent(target)}`,
        null,
        authHeader(),
      );
      setChats(prev => prev.find(c => c.id === res.data.id) ? prev : [res.data, ...prev]);
      setSelectedChat(res.data);
      setShowNewChat(false);
      setRecipientId('');
    } catch {
      setCreateError('Impossible de créer la conversation. Vérifiez l\'ID utilisateur.');
    } finally { setCreating(false); }
  };

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!currentUserId) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: 'calc(100vh - 62px)' }}>
        <p className="text-muted">Connectez-vous pour accéder aux messages.</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container-fluid p-0" style={{ height: 'calc(100vh - 62px)' }}>
      <div className="row g-0 h-100">

        {/* ── Chat list ── */}
        <div className="col-lg-3 col-md-4 bg-white border-end d-flex flex-column h-100">

          {/* Header */}
          <div className="px-3 py-3 border-bottom d-flex justify-content-between align-items-center flex-shrink-0">
            <div>
              <h5 className="fw-bold mb-0">Messages</h5>
              <span className="small text-muted">
                {connected
                  ? <span className="text-success">● En ligne</span>
                  : <span className="text-secondary">○ Reconnexion…</span>}
              </span>
            </div>
            <button
              className="btn btn-outline-dark btn-sm rounded-circle"
              style={{ width: 34, height: 34 }}
              onClick={() => { setShowNewChat(true); setCreateError(''); setRecipientId(''); }}
              title="Nouvelle conversation"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Chat list */}
          <div className="flex-grow-1 overflow-auto">
            {chats.length === 0 ? (
              <div className="text-center text-muted p-5">
                <MessageSquare size={36} className="mb-2 opacity-25" />
                <p className="small mb-0">Aucune conversation</p>
                <p className="small mb-0 opacity-75">Cliquez sur + pour commencer</p>
              </div>
            ) : (
              chats.map(chat => {
                const other = otherUser(chat);
                const active = selectedChat?.id === chat.id;
                return (
                  <div
                    key={chat.id}
                    className={`d-flex align-items-center gap-3 px-3 py-3 border-bottom ${active ? 'bg-light' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <Avatar id={other} size={44} />
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex justify-content-between align-items-baseline">
                        <span className="fw-semibold text-dark small text-truncate" style={{ maxWidth: 130 }}>
                          {other}
                        </span>
                        <span className="text-muted ms-1 flex-shrink-0" style={{ fontSize: '0.68rem' }}>
                          {fmtDate(chat.lastMessageTime ?? chat.createdDate)}
                        </span>
                      </div>
                      {chat.lastMessage && (
                        <p className="text-muted mb-0 text-truncate" style={{ fontSize: '0.78rem' }}>
                          {chat.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat window ── */}
        <div className="col-lg-9 col-md-8 d-flex flex-column h-100 bg-light">
          {!selectedChat ? (

            /* Empty state */
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
              <MessageSquare size={52} className="mb-3 opacity-20" />
              <p className="mb-1 fw-semibold">Sélectionnez une conversation</p>
              <p className="small opacity-75">ou créez-en une nouvelle avec +</p>
            </div>

          ) : (<>

            {/* Chat header */}
            <div className="bg-white border-bottom px-4 py-3 d-flex align-items-center gap-3 flex-shrink-0">
              <Avatar id={otherUser(selectedChat)} size={40} />
              <div>
                <div className="fw-semibold">{otherUser(selectedChat)}</div>
                {!connected && <div className="text-muted small">Reconnexion en cours…</div>}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-grow-1 overflow-auto px-4 py-3">
              {messages.map((msg, idx) => {
                const mine = msg.senderId === currentUserId;
                const prevMsg = messages[idx - 1];
                const showDayBanner = idx === 0 ||
                  new Date(prevMsg.createdDate).toDateString() !== new Date(msg.createdDate).toDateString();

                return (
                  <React.Fragment key={msg.id ?? idx}>
                    {showDayBanner && (
                      <div className="text-center my-3">
                        <small
                          className="text-muted px-3 py-1 rounded-pill border bg-white"
                          style={{ fontSize: '0.7rem' }}
                        >
                          {dayLabel(msg.createdDate)}
                        </small>
                      </div>
                    )}

                    <div className={`d-flex mb-2 ${mine ? 'justify-content-end' : 'justify-content-start'}`}>
                      {!mine && <Avatar id={msg.senderId} size={28} />}

                      <div
                        className={`rounded-3 px-3 py-2 ${mine ? 'bg-dark text-white ms-5' : 'bg-white text-dark ms-2 me-5'}`}
                        style={{
                          maxWidth: '65%',
                          wordBreak: 'break-word',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                        }}
                      >
                        {msg.type === 'TEXT' ? (
                          <span style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{msg.content}</span>
                        ) : msg.mediaFilePath ? (
                          <a
                            href={msg.mediaFilePath}
                            target="_blank"
                            rel="noreferrer"
                            className={mine ? 'text-white' : 'text-primary'}
                          >
                            📎 Pièce jointe
                          </a>
                        ) : (
                          <span className="text-muted fst-italic small">Média non disponible</span>
                        )}

                        {/* Timestamp + read receipt */}
                        <div
                          className={`text-end mt-1 ${mine ? 'text-white opacity-50' : 'text-muted'}`}
                          style={{ fontSize: '0.62rem' }}
                        >
                          {fmt(msg.createdDate)}
                          {mine && (
                            <span className="ms-1" title={msg.state === 'SEEN' ? 'Lu' : 'Envoyé'}>
                              {msg.state === 'SEEN' ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-top px-4 py-3 flex-shrink-0">
              <div className="d-flex align-items-end gap-2">
                <textarea
                  className="form-control border-0 bg-light rounded-3"
                  rows={1}
                  placeholder={connected ? 'Écrire un message… (Entrée pour envoyer)' : 'Connexion perdue…'}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={!connected}
                  style={{ resize: 'none' }}
                />
                <button
                  className="btn btn-dark rounded-circle flex-shrink-0"
                  style={{ width: 42, height: 42 }}
                  onClick={sendMessage}
                  disabled={!inputText.trim() || !connected}
                  title="Envoyer (Entrée)"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

          </>)}
        </div>
      </div>

      {/* ── New chat modal ── */}
      {showNewChat && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4">
              <div className="modal-header border-0 pb-0">
                <h6 className="modal-title fw-bold">Nouvelle conversation</h6>
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setShowNewChat(false)}>
                  <X size={14} />
                </button>
              </div>
              <div className="modal-body">
                <label className="form-label small fw-semibold text-muted">ID de l'utilisateur destinataire</label>
                <input
                  type="text"
                  className={`form-control ${createError ? 'is-invalid' : ''}`}
                  placeholder="Identifiant Keycloak (sub)"
                  value={recipientId}
                  onChange={e => { setRecipientId(e.target.value); setCreateError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') startChat(); }}
                  autoFocus
                />
                {createError && <div className="invalid-feedback">{createError}</div>}
                <p className="text-muted small mt-2 mb-0">
                  L'ID correspond au champ <code>sub</code> du token Keycloak de l'autre utilisateur.
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-light" onClick={() => setShowNewChat(false)}>Annuler</button>
                <button
                  className="btn btn-dark"
                  onClick={startChat}
                  disabled={!recipientId.trim() || creating}
                >
                  {creating && <span className="spinner-border spinner-border-sm me-2" />}
                  Démarrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
