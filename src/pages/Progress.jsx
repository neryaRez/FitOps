import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import WeightChart from '@/components/progress/WeightChart';
import MeasurementsPanel from '@/components/progress/MeasurementsPanel';
import PhotosPanel from '@/components/progress/PhotosPanel';

const TABS = [
  { id: 'weight', label: 'Weight Trend' },
  { id: 'measurements', label: 'Measurements' },
  { id: 'photos', label: 'Photos' },
];

export default function Progress() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'weight';
  });

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Progress</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your transformation over time</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 w-full sm:w-auto sm:inline-flex">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-brand shadow-sm'
                : 'text-muted-foreground hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {user && activeTab === 'weight' && <WeightChart userId={user.email} />}
      {user && activeTab === 'measurements' && <MeasurementsPanel userId={user.email} />}
      {user && activeTab === 'photos' && <PhotosPanel userId={user.email} />}
    </div>
  );
}