import { useState, useEffect } from 'react';
import { getWeightLogs, addWeightLog, deleteWeightLog } from '@/api/progressApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2 } from 'lucide-react';

export default function WeightChart({ userId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await getWeightLogs(userId);
    setLogs(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const handleAdd = async () => {
    if (!weight || !date) return;
    setSaving(true);
    await addWeightLog(userId, date, Number(weight));
    setWeight(''); setShowForm(false); setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    await deleteWeightLog(id);
    load();
  };

  const chartData = logs.map(l => ({ date: l.date, weight: l.weightKg }));

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-text-primary">Weight Trend</h3>
          <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors">
            <Plus className="w-4 h-4" /> Add log
          </button>
        </div>

        {showForm && (
          <div className="bg-surface rounded-xl p-4 mb-5 flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1 font-medium">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1 font-medium">Weight (kg)</label>
              <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75.4"
                className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand" />
            </div>
            <button onClick={handleAdd} disabled={saving} className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-60">
              {saving ? '…' : 'Save'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-brand-light border-t-brand rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No weight logs yet. Add your first entry above.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                formatter={(v) => [`${v} kg`, 'Weight']}
              />
              <Line type="monotone" dataKey="weight" stroke="#4F6EF7" strokeWidth={2.5} dot={{ fill: '#4F6EF7', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Log history */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-text-primary mb-4">Log History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...logs].reverse().map(log => (
              <div key={log.id} className="flex items-center justify-between px-4 py-2.5 bg-surface rounded-xl">
                <span className="text-sm text-muted-foreground">{log.date}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-text-primary">{log.weightKg} kg</span>
                  <button onClick={() => handleDelete(log.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}