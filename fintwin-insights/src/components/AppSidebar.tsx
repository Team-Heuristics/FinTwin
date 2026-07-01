import { LayoutDashboard, Upload, CreditCard, TrendingUp, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Upload Transactions', path: '/upload', icon: Upload },
  { label: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
  { label: 'Insights', path: '/insights', icon: TrendingUp },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('fintwin_token');
    navigate('/');
  };

  return (
    <aside className="w-[260px] min-h-screen border-r border-border bg-sidebar flex flex-col">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">F</span>
          </div>
          <span className="text-lg font-bold text-foreground">FinTwin</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={active ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button onClick={handleLogout} className="sidebar-link w-full text-destructive hover:bg-destructive/5">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
