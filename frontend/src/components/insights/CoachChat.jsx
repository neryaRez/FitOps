import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { listCoachConversations, createCoachConversation, getCoachConversation } from '@/api/coachChatApi';
import ConversationSidebar from './ConversationSidebar';
import ChatPanel from './ChatPanel';


function normalizeConversations(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.conversations)) return result.conversations;
  return [];
}


export default function CoachChat({ userId }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) loadConversations();
  }, [userId]);

  const loadConversations = async () => {
    setLoading(true);

    try {
      const convosResult = await listCoachConversations();
      const convos = normalizeConversations(convosResult);

      // AWS backend already returns only the authenticated user's conversations.
      // Do not filter by metadata.userId here because Cognito sub may differ from email.
      const mine = convos
        .sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0));

      setConversations(mine);

      if (mine.length > 0 && !activeConversation) {
        const full = await getCoachConversation(mine[0].id);
        setActiveConversation(full);
      }
    } catch (err) {
      console.error('Failed to load coach conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = async () => {
    const num = conversations.length + 1;
    const conv = await createCoachConversation(`Session #${num}`);
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
  };

  const handleSelect = async (conv) => {
    const full = await getCoachConversation(conv.id);
    setActiveConversation(full);
  };

  const handleDelete = async (convId) => {
    // Remove from list immediately
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversation?.id === convId) {
      const remaining = conversations.filter(c => c.id !== convId);
      if (remaining.length > 0) {
        const full = await getCoachConversation(remaining[0].id);
        setActiveConversation(full);
      } else {
        setActiveConversation(null);
      }
    }
    // Note: base44 doesn't expose a deleteConversation — we just hide it from UI
  };

  const handleConversationUpdated = async (fullConversation) => {
    if (fullConversation?.id) {
      setActiveConversation(fullConversation);
    }

    try {
      await loadConversations();
    } catch (err) {
      console.error('Failed to refresh conversations after message:', err);
    }
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
        <ChatPanel conversation={activeConversation} onConversationUpdated={handleConversationUpdated} />
      </div>
    </div>
  );
}