import React, { useState, useEffect, useRef } from 'react';
import type { Conversation, Message, Peer } from '../types';
import { Send, Lock, Check, CheckCheck, Clock, CornerUpRight } from 'lucide-react';

interface ChatsViewProps {
  conversations: Conversation[];
  peers: Peer[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  messages: Message[];
  onSendMessage: (receiverId: string, content: string, isEncrypted: boolean) => Promise<void>;
  localUserId: string;
}

/* ── Avatar color palette ── */
const AVATAR_COLORS = [
  '#22c55e', '#ef4444', '#f59e0b', '#ec4899',
  '#6366f1', '#14b8a6', '#8b5cf6', '#3b82f6',
];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getTransportLabel(transport?: string): string {
  switch (transport) {
    case 'BLE': return 'BLE';
    case 'WIFI_DIRECT': return 'Wi-Fi Direct';
    case 'LAN': return 'LAN';
    default: return 'Mesh';
  }
}

export const ChatsView: React.FC<ChatsViewProps> = ({
  conversations,
  peers,
  activeConversationId,
  onSelectConversation,
  messages,
  onSendMessage,
  localUserId,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.conversationId === activeConversationId);
  const activePeer = peers.find(p =>
    activeConv?.title.includes(p.displayName) ||
    activeConv?.conversationId.includes(p.peerId)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const targetPeerId = activePeer?.peerId ||
      (activeConv ? activeConv.conversationId.replace('conv-', '').split('_').find(id => id !== localUserId) : null);
    if (!targetPeerId) return;

    setIsSending(true);
    try {
      await onSendMessage(targetPeerId, inputText.trim(), true);
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  // If no active conversation selected, show the conversation picker
  if (!activeConv) {
    return (
      <div style={{ padding: '20px 16px', paddingBottom: '80px' }}>
        {/* Header */}
        <h2 style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '20px',
        }}>
          Chats
        </h2>

        {/* Avatar Scroller */}
        <div style={{
          display: 'flex',
          gap: '18px',
          overflowX: 'auto',
          paddingBottom: '16px',
          marginBottom: '16px',
        }}>
          {conversations.map((conv, i) => (
            <button
              key={conv.conversationId}
              onClick={() => onSelectConversation(conv.conversationId)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                minWidth: '60px',
              }}
            >
              <div
                className="avatar-circle"
                style={{ background: getAvatarColor(i) }}
              >
                {getInitials(conv.title)}
              </div>
              <span style={{
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                maxWidth: '64px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {conv.title.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Conversations List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {conversations.length === 0 ? (
            <div className="card" style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
            }}>
              No active conversations yet.<br />
              Go to <strong>Network</strong> tab to discover nearby peers.
            </div>
          ) : (
            conversations.map((conv, i) => {
              const peer = peers.find(p =>
                conv.title.includes(p.displayName) || conv.conversationId.includes(p.peerId)
              );
              return (
                <div
                  key={conv.conversationId}
                  onClick={() => onSelectConversation(conv.conversationId)}
                  className="card-sm"
                  style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      className="avatar-circle-sm avatar-circle"
                      style={{
                        background: getAvatarColor(i),
                        width: '40px',
                        height: '40px',
                        fontSize: '0.78rem',
                      }}
                    >
                      {getInitials(conv.title)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        color: 'var(--text-primary)',
                      }}>
                        {conv.title}
                      </div>
                      <div style={{
                        fontSize: '0.73rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px',
                      }}>
                        <Lock size={10} />
                        <span>Encrypted · {getTransportLabel(peer?.preferredTransport)}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Active chat view
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
    }}>
      {/* Chat Header */}
      <div className="card" style={{
        margin: '0 12px',
        padding: '14px 16px',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '4px',
      }}>
        {/* Avatar Scroller */}
        <div style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '14px',
          marginBottom: '14px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <h2 style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginRight: '4px',
            alignSelf: 'center',
            flexShrink: 0,
          }}>
            Chats
          </h2>
          {conversations.map((conv, i) => (
            <button
              key={conv.conversationId}
              onClick={() => onSelectConversation(conv.conversationId)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                minWidth: '52px',
                opacity: conv.conversationId === activeConversationId ? 1 : 0.65,
                transition: 'opacity 0.15s',
              }}
            >
              <div
                className="avatar-circle"
                style={{
                  background: getAvatarColor(i),
                  width: '42px',
                  height: '42px',
                  fontSize: '0.78rem',
                  boxShadow: conv.conversationId === activeConversationId
                    ? `0 0 0 2px var(--bg-surface), 0 0 0 4px ${getAvatarColor(i)}`
                    : 'none',
                }}
              >
                {getInitials(conv.title)}
              </div>
              <span style={{
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                maxWidth: '56px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {conv.title.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Active Peer Info */}
        <div>
          <div style={{
            fontWeight: 800,
            fontSize: '1rem',
            color: 'var(--text-primary)',
          }}>
            {activeConv.title}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {activePeer && (
              <>
                <span>{activePeer.displayName.includes('Dept') ? '' : 'CS Dept'}</span>
                <span>·</span>
                <span>connected via {getTransportLabel(activePeer.preferredTransport)}</span>
                <span>·</span>
                <span>{activePeer.hopCount || 1} hop{(activePeer.hopCount || 1) > 1 ? 's' : ''}</span>
              </>
            )}
            {!activePeer && <span>Mesh peer</span>}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        padding: '12px 16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            margin: 'auto',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            padding: '20px',
          }}>
            🔒 Start of encrypted peer-to-peer session.<br />
            Messages are relayed without internet.
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.senderId === localUserId;
            return (
              <div
                key={msg.messageId}
                className={isMine ? 'chat-bubble-out' : 'chat-bubble-in'}
              >
                <div style={{
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>

                <div className="chat-bubble-meta">
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {msg.relayCount > 0 && (
                    <>
                      <span>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <CornerUpRight size={10} />
                        relayed via {msg.relayCount} hop{msg.relayCount > 1 ? 's' : ''}
                      </span>
                    </>
                  )}

                  {activePeer && (
                    <>
                      <span>·</span>
                      <span>{getTransportLabel(activePeer.preferredTransport)}</span>
                    </>
                  )}

                  {isMine && (
                    <span style={{ marginLeft: '2px' }}>
                      {msg.status === 'DELIVERED' && <CheckCheck size={13} color="#22c55e" />}
                      {msg.status === 'SENT' && <Check size={13} />}
                      {msg.status === 'SENDING' && <Clock size={11} />}
                      {msg.status === 'QUEUED' && <span style={{ fontSize: '0.65rem' }}>[Q]</span>}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} style={{
        padding: '10px 12px 14px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div className="card-sm" style={{
          flex: 1,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}>
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Message ${activeConv.title.split(' ')[0]}...`}
            style={{
              flex: 1,
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="btn btn-primary"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            padding: 0,
            flexShrink: 0,
            opacity: !inputText.trim() || isSending ? 0.5 : 1,
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
