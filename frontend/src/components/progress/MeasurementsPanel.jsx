import { useState, useEffect } from 'react';
import { getMeasurementLogs, addMeasurementLog, deleteMeasurementLog } from '@/api/progressApi';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const FIELDS = [
  { key: 'neck', label: 'Neck' },
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'leftArm', label: 'Left Arm' },
  { key: 'rightArm', label: 'Right Arm' },
  { key: 'leftThigh', label: 'Left Thigh' },
  { key: 'rightThigh', label: 'Right Thigh' },
];

export default function MeasurementsPanel({ userId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    const data = await getMeasurementLogs(userId);
    setLogs(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const handleAdd = async () => {
    setSaving(true);
    await addMeasurementLog(userId, { date, ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)])) });
    setValues({}); setShowForm(false); setSaving(false);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-text-primary">Body Measurements</h3>
          <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors">
            <Plus className="w-4 h-4" /> Add entry
          </button>
        </div>

        {showForm && (
          <div className="bg-surface rounded-xl p-4 mb-5 space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1 font-medium">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-muted-foreground mb-1 font-medium">{f.label} (cm)</label>
                  <input type="number" step="0.1" value={values[f.key] || ''} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder="0.0"
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand" />
                </div>
              ))}
            </div>
            <button onClick={handleAdd} disabled={saving} className="w-full bg-brand text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : 'Save measurements'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-brand-light border-t-brand rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No measurements logged yet.</div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors"
                >
                  <span className="text-sm font-medium text-text-primary">{log.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Waist: {log.waist ?? '—'} cm
                    </span>
                    {expanded === log.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {expanded === log.id && (
                  <div className="px-4 pb-4 bg-surface border-t border-border">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                      {FIELDS.map(f => (
                        <div key={f.key}>
                          <p className="text-xs text-muted-foreground">{f.label}</p>
                          <p className="text-sm font-semibold text-text-primary">{log[f.key] ?? '—'} {log[f.key] ? 'cm' : ''}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { deleteMeasurementLog(log.id); load(); }}
                      className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3 h-3" /> Delete entry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}