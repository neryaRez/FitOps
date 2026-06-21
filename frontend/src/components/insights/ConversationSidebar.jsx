import { Plus, Trash2, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

function truncateTitle(value, maxLength = 34) {
  const text = String(value || '').trim().replace(/\s+/g, ' ');

  if (!text) return '';

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function getMessageText(message) {
  if (!message) return '';

  if (typeof message.content === 'string') return message.content;
  if (typeof message.text === 'string') return message.text;
  if (typeof message.message === 'string') return message.message;

  return '';
}

function getConversationTitle(conv) {
  const explicitTitle =
    conv?.title ||
    conv?.metadata?.title ||
    conv?.name;

  if (
    explicitTitle &&
    !['Coach Session', 'Session', 'New Session'].includes(String(explicitTitle).trim())
  ) {
    return truncateTitle(explicitTitle);
  }

  const messages = Array.isArray(conv?.messages) ? conv.messages : [];

  const firstUserMessage = messages.find((msg) => {
    const role = String(msg?.role || msg?.sender || msg?.type || '').toLowerCase();
    return role === 'user' || role === 'human';
  });

  const firstMessageText = getMessageText(firstUserMessage);

  if (firstMessageText) {
    return truncateTitle(firstMessageText);
  }

  return 'New conversation';
}

function getConversationDate(conv) {
  const rawDate =
    conv?.updated_date ||
    conv?.created_date ||
    conv?.updatedAt ||
    conv?.createdAt;

  if (!rawDate) {
    return '';
  }

  try {
    return format(new Date(rawDate), 'MMM d, yyyy');
  } catch {
    return '';
  }
}

export default function ConversationSidebar({ conversations, activeId, onSelect, onNew, onDelete }) {
  return (
    <div
      className="flex flex-col rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', minHeight: '400px' }}
    >
      <div
        className="px-4 py-3 border-b border-white/10 flex items-center justify-between"
        style={{ background: 'rgba(0,0,0,0.2)' }}
      >
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Conversations</span>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
            <MessageCircle className="w-6 h-6 text-white/20" />
            <p className="text-xs text-white/30">No conversations yet.<br />Start a new one!</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const title = getConversationTitle(conv);
            const date = getConversationDate(conv);

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className="group w-full px-4 py-4 text-left transition-all relative"
                style={{
                  background: isActive ? 'rgba(0,191,255,0.14)' : 'transparent',
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      background: isActive ? '#00E5FF' : 'rgba(255,255,255,0.22)',
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white/90 truncate">
                      {title}
                    </p>

                    {date && (
                      <p className="text-xs text-white/35 mt-1">
                        {date}
                      </p>
                    )}
                  </div>

                  {onDelete && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(conv.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          onDelete(conv.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white/40" />
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
