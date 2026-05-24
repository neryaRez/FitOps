import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ConversationSidebar from './ConversationSidebar';
import ChatPanel from './ChatPanel';

export default function CoachChat({ userId }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) loadConversations();
  }, [userId]);

  const loadConversations = async () => {
    setLoading(true);
    const convos = await base44.agents.listConversations({ agent_name: 'fitops_coach' });
    const mine = (convos || []).filter(c => c.metadata?.userId === userId)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    setConversations(mine);
    if (mine.length > 0 && !activeConversation) {
      const full = await base44.agents.getConversation(mine[0].id);
      setActiveConversation(full);
    }
    setLoading(false);
  };

  const handleNew = async () => {
    const num = conversations.length + 1;
    const conv = await base44.agents.createConversation({
      agent_name: 'fitops_coach',
      metadata: { userId, title: `Session #${num}` },
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
  };

  const handleSelect = async (conv) => {
    const full = await base44.agents.getConversation(conv.id);
    setActiveConversation(full);
  };

  const handleDelete = async (convId) => {
    // Remove from list immediately
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversation?.id === convId) {
      const remaining = conversations.filter(c => c.id !== convId);
      if (remaining.length > 0) {
        const full = await base44.agents.getConversation(remaining[0].id);
        setActiveConversation(full);
      } else {
        setActiveConversation(null);
      }
    }
    // Note: base44 doesn't expose a deleteConversation — we just hide it from UI
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 text-white/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Sidebar */}
      <div className="md:w-56 flex-shrink-0">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversation?.id}
          onSelect={handleSelect}
          onNew={handleNew}
          onDelete={handleDelete}
        />
      </div>

      {/* Chat panel */}
      <div className="flex-1 min-w-0">
        <ChatPanel conversation={activeConversation} />
      </div>
    </div>
  );
}