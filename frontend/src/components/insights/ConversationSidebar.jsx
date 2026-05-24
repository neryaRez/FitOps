import { Plus, Trash2, MessageCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function ConversationSidebar({ conversations, activeId, onSelect, onNew, onDelete }) {
  return (
    <div
      className="flex flex-col rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', minHeight: '400px' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between"
        style={{ background: 'rgba(0,0,0,0.2)' }}>
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Conversations</span>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
            <MessageCircle className="w-6 h-6 text-white/20" />
            <p className="text-xs text-white/30">No conversations yet.<br />Start a new one!</p>
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = conv.id === activeId;
            const title = conv.metadata?.title || 'Coach Session';
            const date = conv.created_date ? format(new Date(conv.created_date), 'MMM d, yyyy') : '';
            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-all ${
                  isActive ? 'bg-white/10' : 'hover:bg-white/06'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isActive ? 'bg-cyan-400' : 'bg-white/20'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isActive ? 'text-cyan-300' : 'text-white/80'}`}>{title}</p>
                  <p className="text-xs text-white/30 mt-0.5">{date}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400 p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}