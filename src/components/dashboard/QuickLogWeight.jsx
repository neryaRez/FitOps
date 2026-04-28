import { useState } from 'react';
import { X } from 'lucide-react';
import { addWeightLog } from '@/api/progressApi';

export default function QuickLogWeight({ userId, onClose, onSaved }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!weight || !date) return;
    setSaving(true);
    await addWeightLog(userId, date, Number(weight));
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="rounded-2xl border border-white/15 w-full max-w-sm p-6 text-white" style={{ background: 'rgba(15,12,41,0.92)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white">Log Weight</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="e.g. 75.4"
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none text-white placeholder:text-white/30"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !weight}
          className="w-full mt-6 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}
        >
          {saving ? 'Saving…' : 'Save log'}
        </button>
      </div>
    </div>
  );
}