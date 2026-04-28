import ReactMarkdown from 'react-markdown';

const iconMap = {
  blue: 'from-blue-500 to-cyan-400',
  purple: 'from-purple-500 to-pink-400',
  green: 'from-green-500 to-emerald-400',
  orange: 'from-orange-500 to-yellow-400',
  indigo: 'from-indigo-500 to-blue-400',
};

export default function InsightCard({ icon: Icon, label, content, color }) {
  const gradient = iconMap[color] || iconMap.blue;

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/10"
      style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
    >
      {/* Card header */}
      <div className={`px-5 py-4 bg-gradient-to-r ${gradient} bg-opacity-20 flex items-center gap-3`}
        style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))`, borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-bold text-white text-base">{label}</h3>
      </div>

      {/* Markdown content */}
      <div className="px-5 py-4">
        {content ? (
          <ReactMarkdown
            className="text-sm text-white/75 leading-relaxed prose prose-invert prose-sm max-w-none
              [&>p]:mb-2 [&>ul]:mt-1 [&>ul]:mb-2 [&>ul>li]:mb-0.5
              [&>ol]:mt-1 [&>ol]:mb-2 [&>ol>li]:mb-0.5
              [&>h3]:text-white [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-1
              [&>strong]:text-cyan-300 [&>b]:text-cyan-300"
          >
            {content}
          </ReactMarkdown>
        ) : (
          <p className="text-sm text-white/30 italic">No data yet — click Refresh to generate.</p>
        )}
      </div>
    </div>
  );
}