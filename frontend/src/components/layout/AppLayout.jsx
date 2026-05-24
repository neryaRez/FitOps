import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Lightbulb, Settings, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/insights', icon: Lightbulb, label: 'AI Insights' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const handleLogout = () => base44.auth.logout('/');

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#0F0C29' }}>
      {/* Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('https://media.base44.com/images/public/69ea569deb9059b940e51f3e/3053e376d_generated_image.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 z-0" style={{ background: 'rgba(15,12,41,0.72)' }} />

      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md" style={{ background: 'rgba(15,12,41,0.7)' }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="font-bold text-xl tracking-tight text-white select-none">
            Fit<span className="text-cyan-400">Ops</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/15 text-cyan-400'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-red-400 transition-colors px-3 py-2 rounded-xl hover:bg-white/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-5 py-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 backdrop-blur-md pb-safe" style={{ background: 'rgba(15,12,41,0.85)' }}>
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-white/50'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}