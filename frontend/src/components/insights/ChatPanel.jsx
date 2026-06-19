import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendCoachMessage } from '@/api/coachChatApi';

const mdClass = `prose prose-invert prose-sm max-w-none
  [&>p]:mb-2 [&>p:last-child]:mb-0
  [&>ul]:mt-1 [&>ul]:mb-2 [&>ul>li]:mb-0.5
  [&>ol]:mt-1 [&>ol]:mb-2 [&>ol>li]:mb-0.5
  [&>h3]:text-cyan-300 [&>h3]:font-bold [&>h3]:mt-3 [&>h3]:mb-1 [&>h3]:text-sm
  [&>strong]:text-cyan-300
  [&>table]:w-full [&>table]:text-xs [&>table]:border-collapse
  [&>table_td]:border [&>table_td]:border-white/10 [&>table_td]:px-2 [&>table_td]:py-1
  [&>table_th]:border [&>table_th]:border-white/10 [&>table_th]:px-2 [&>table_th]:py-1 [&>table_th]:bg-white/10`;

export default function ChatPanel({ conversation, onConversationUpdated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    setMessages(Array.isArray(conversation?.messages) ? conversation.messages : []);
  }, [conversation?.id, conversation?.messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !conversation || sending) return;

    setInput('');
    setSending(true);

    const optimisticMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      created_date: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const updatedConversation = await sendCoachMessage(conversation.id, text);
      setMessages(Array.isArray(updatedConversation?.messages) ? updatedConversation.messages : []);
    } catch (err) {
      console.error('Failed to send coach message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const visibleMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-white/10 gap-3 text-center p-8"
        style={{ background: 'rgba(255,255,255,0.03)', minHeight: '400px' }}>
        <MessageCircle className="w-10 h-10 text-white/15" />
        <p className="text-white/30 text-sm">Select a conversation or start a new one</p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/15"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', height: '600px' }}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, rgba(0,191,255,0.12), rgba(79,110,247,0.12))' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}>
          🏋️
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm truncate">{conversation.metadata?.title || 'Coach Session'}</h3>
          <p className="text-xs text-white/40">FitOps AI Coach · Persistent memory</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <MessageCircle className="w-10 h-10 text-white/20" />
            <p className="text-white/40 text-sm">Start the conversation!</p>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {['Create me a weekly training plan', 'What should I eat today?', 'Review my progress'].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-cyan-400/50 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          visibleMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}>🏋️</div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'border border-white/10 text-white/85'}`}
                style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #00BFFF44, #4F6EF744)' } : { background: 'rgba(255,255,255,0.06)' }}
              >
                {msg.role === 'assistant'
                  ? <ReactMarkdown className={mdClass}>{msg.content}</ReactMarkdown>
                  : <p>{msg.content}</p>}
              </div>
            </div>
          ))
        )}

        {sending && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}>🏋️</div>
            <div className="rounded-2xl px-4 py-3 border border-white/10" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach anything… (Enter to send)"
            rows={1}
            className="flex-1 text-white placeholder:text-white/30 text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400/50 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.07)', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-white/25 mt-2">Memory is saved automatically across sessions</p>
      </div>
    </div>
  );
}