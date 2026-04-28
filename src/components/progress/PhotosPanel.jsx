import { useState, useEffect } from 'react';
import { getProgressPhotos, uploadProgressPhoto, deleteProgressPhoto } from '@/api/progressApi';
import { Upload, Trash2, X } from 'lucide-react';

const ANGLES = ['front', 'side', 'back'];

export default function PhotosPanel({ userId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [angle, setAngle] = useState('front');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = async () => {
    const data = await getProgressPhotos(userId);
    setPhotos(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    await uploadProgressPhoto(userId, date, angle, file);
    setFile(null); setPreview(null); setShowForm(false); setUploading(false);
    load();
  };

  const grouped = photos.reduce((acc, p) => {
    const d = p.date;
    if (!acc[d]) acc[d] = {};
    acc[d][p.angle] = p;
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-text-primary">Progress Photos</h3>
          <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors">
            <Upload className="w-4 h-4" /> Upload photo
          </button>
        </div>

        {showForm && (
          <div className="bg-surface rounded-xl p-4 mb-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1 font-medium">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1 font-medium">Angle</label>
                <div className="flex gap-2">
                  {ANGLES.map(a => (
                    <button key={a} onClick={() => setAngle(a)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-medium capitalize transition-colors ${angle === a ? 'bg-brand text-white border-brand' : 'border-border text-muted-foreground hover:border-brand'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full h-48 object-cover rounded-xl" />
                <button onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-brand transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to select photo</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}

            <button onClick={handleUpload} disabled={uploading || !file} className="w-full bg-brand text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-60">
              {uploading ? 'Uploading…' : 'Upload photo'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-brand-light border-t-brand rounded-full animate-spin" /></div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No photos yet. Upload your first progress photo above.</div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date}>
                <p className="text-sm font-semibold text-text-primary mb-3">{date}</p>
                <div className="grid grid-cols-3 gap-3">
                  {ANGLES.map(a => {
                    const photo = grouped[date][a];
                    return (
                      <div key={a} className="relative rounded-xl overflow-hidden aspect-[3/4] bg-surface">
                        {photo ? (
                          <>
                            <img src={photo.photoUrl} alt={a} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex items-end justify-between">
                              <span className="text-white text-xs font-medium capitalize">{a}</span>
                              <button onClick={() => { deleteProgressPhoto(photo.id); load(); }}
                                className="text-white/80 hover:text-white transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <span className="text-xs text-muted-foreground capitalize">{a}</span>
                            <span className="text-xs text-muted-foreground">No photo</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}