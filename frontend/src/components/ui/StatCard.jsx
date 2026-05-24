export default function StatCard({ label, value, unit, icon: Icon, gradient, iconBg, iconColor }) {
  if (gradient) {
    return (
      <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} shadow-md flex items-start gap-4`}>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/25`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <p className="text-xs text-white/70 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white mt-0.5">
            {value ?? '—'}
            {unit && <span className="text-sm font-normal text-white/70 ml-1">{unit}</span>}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-card flex items-start gap-4`}>
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg || 'bg-brand-light'}`}>
          <Icon className={`w-5 h-5 ${iconColor || 'text-brand'}`} />
        </div>
      )}
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-semibold text-text-primary mt-0.5">
          {value ?? '—'}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}