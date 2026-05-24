import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const insightItems = [
  {
    key: 'bmiAnalysis',
    label: 'BMI Analysis',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&q=80',
    gradient: 'from-blue-500 to-cyan-400',
    tag: 'Body',
  },
  {
    key: 'fitnessPath',
    label: 'Fitness Path',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
    gradient: 'from-purple-500 to-pink-400',
    tag: 'Training',
  },
  {
    key: 'mealGuidance',
    label: 'Meal Guidance',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    gradient: 'from-green-500 to-emerald-400',
    tag: 'Nutrition',
  },
  {
    key: 'workoutPlan',
    label: 'Workout Plan',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
    gradient: 'from-orange-500 to-yellow-400',
    tag: 'Exercise',
  },
];

function InsightModal({ item, content, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden border border-white/15"
        style={{ background: 'rgba(15,12,41,0.97)', backdropFilter: 'blur(20px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero image */}
        <div className="relative h-40 overflow-hidden">
          <img src={item.image} alt={item.label} className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} opacity-70`} />
          <div className="absolute top-3 left-4">
            <span className="bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">{item.tag}</span>
          </div>
          <div className="absolute bottom-4 left-4">
            <p className="text-white font-bold text-lg drop-shadow">{item.label}</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-80 overflow-y-auto">
          <ReactMarkdown
            className="text-base text-white/90 leading-7 prose prose-invert prose-base max-w-none
              [&>p]:mb-3 [&>p]:text-white/85 [&>p]:font-normal
              [&>ul]:mt-1 [&>ul]:mb-3 [&>ul>li]:mb-1 [&>ul>li]:text-white/80
              [&>ol]:mt-1 [&>ol]:mb-3 [&>ol>li]:mb-1 [&>ol>li]:text-white/80
              [&>strong]:text-cyan-300 [&>strong]:font-semibold"
          >
            {content}
          </ReactMarkdown>
        </div>

        <div className="px-5 pb-4">
          <Link
            to="/insights"
            onClick={onClose}
            className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}
          >
            View full AI report →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AIInsightsCard({ recommendation }) {
  const [expanded, setExpanded] = useState(null);

  const activeItem = insightItems.find(i => i.key === expanded);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/15" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
      {/* Header */}
      <div className="p-5 border-b border-white/10" style={{ background: 'linear-gradient(135deg, rgba(79,110,247,0.4), rgba(168,85,247,0.4))' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">✨</div>
          <div>
            <h3 className="font-bold text-white text-base">AI Insights</h3>
            <p className="text-white/60 text-xs">Powered by FitOps AI</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {recommendation ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {insightItems.map(({ key, label, image, gradient, tag }) => (
              <button
                key={key}
                onClick={() => setExpanded(key)}
                className="rounded-2xl overflow-hidden border border-white/10 group text-left w-full cursor-pointer hover:border-white/25 transition-all"
              >
                <div className="relative h-28 overflow-hidden">
                  <img src={image} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${gradient} opacity-70`} />
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">{tag}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <p className="text-white font-bold text-sm drop-shadow">{label}</p>
                    <ChevronDown className="w-4 h-4 text-white/70" />
                  </div>
                </div>
                <div className="p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-sm text-white/75 leading-relaxed line-clamp-2 font-medium">
                    {recommendation[key] || 'Analysis will appear here once AI is active.'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl p-5 text-center border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80" alt="Get started" className="w-full h-28 object-cover rounded-xl mb-3 opacity-70" />
            <p className="text-sm text-white/60 mb-3">Complete your profile to generate AI insights.</p>
            <Link to="/onboarding" className="text-cyan-400 text-sm font-medium hover:underline">Set up profile →</Link>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10">
          <Link to="/insights" className="text-xs text-cyan-400 font-medium hover:underline">View full AI report →</Link>
        </div>
      </div>

      {/* Expanded modal */}
      {expanded && activeItem && recommendation && (
        <InsightModal
          item={activeItem}
          content={recommendation[expanded]}
          onClose={() => setExpanded(null)}
        />
      )}
    </div>
  );
}