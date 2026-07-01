import { Bell, CircleHelp, LogOut, Settings, Upload, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { analyticsService, DashboardOverviewPayload } from '@/services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AppNavbar = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverviewPayload | null>(null);
  const [uploadSuccessText, setUploadSuccessText] = useState<string | null>(null);

  const userName = useMemo(() => localStorage.getItem('fintwin_user_name') || 'User', []);
  const userInitial = useMemo(() => userName.trim().charAt(0).toUpperCase() || 'U', [userName]);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const response = await analyticsService.getDashboard();
        setOverview(response.data.data);
      } catch {
        // Keep navbar resilient if dashboard API is unavailable on non-auth pages.
      }
    };

    const uploadMarker = localStorage.getItem('fintwin_last_upload_success');
    if (uploadMarker) {
      setUploadSuccessText('✔ Transactions uploaded successfully');
    }

    loadOverview();
  }, []);

  const alertLines = useMemo(() => {
    const lines: string[] = [];
    const subscriptions = overview?.subscriptions || [];
    const netflix = subscriptions.find((sub) => sub.serviceName.toLowerCase().includes('netflix'));

    if (netflix) {
      lines.push('⚠ Netflix subscription detected');
    } else if (subscriptions.length > 0) {
      lines.push(`⚠ ${subscriptions[0].serviceName} subscription detected`);
    }

    if (Number(overview?.savingsRatio || 0) < 0.1) {
      lines.push('⚠ Savings ratio below 10%');
    }

    if (uploadSuccessText) {
      lines.push(uploadSuccessText);
    }

    if (!lines.length) {
      lines.push('✔ No critical financial alerts right now');
    }

    return lines;
  }, [overview, uploadSuccessText]);

  const hasCriticalAlerts = alertLines.some((line) => line.startsWith('⚠'));

  const handleLogout = () => {
    localStorage.removeItem('fintwin_token');
    localStorage.removeItem('fintwin_user_name');
    localStorage.removeItem('fintwin_user_email');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const showPlaceholder = (label: string) => {
    toast.info(`${label} will be available soon.`);
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8">
      <div />
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${hasCriticalAlerts ? 'bg-destructive' : 'bg-success'}`} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 rounded-xl border border-border/70 bg-[linear-gradient(180deg,hsl(0_0%_100%),hsl(220_20%_98%))] p-2 shadow-[0_18px_50px_hsl(239_84%_67%/0.12)]"
          >
            <DropdownMenuLabel className="px-2 py-1 text-xs text-muted-foreground">Financial Alerts</DropdownMenuLabel>
            <div className="space-y-1 px-1 pb-1">
              {alertLines.map((line, index) => (
                <div
                  key={`${line}-${index}`}
                  className={`rounded-lg px-3 py-2 text-sm border ${line.startsWith('⚠')
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : 'bg-success/10 text-success border-success/20'
                    }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl border border-border/70 px-2.5 py-1.5 bg-card/90 hover:bg-accent/60 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{userInitial}</span>
              </div>
              <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{userName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 rounded-xl border border-border/70 bg-[linear-gradient(180deg,hsl(0_0%_100%),hsl(220_25%_98%))] p-1.5 shadow-[0_16px_44px_hsl(239_84%_67%/0.15)]"
          >
            <DropdownMenuLabel className="px-2 py-1 text-xs text-muted-foreground">Account</DropdownMenuLabel>
            <DropdownMenuItem className="rounded-lg gap-2" onClick={() => showPlaceholder('Profile')}>
              <User className="w-4 h-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg gap-2" onClick={() => showPlaceholder('Account Settings')}>
              <Settings className="w-4 h-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg gap-2" onClick={() => navigate('/upload')}>
              <Upload className="w-4 h-4" />
              <span>Upload Transactions</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg gap-2" onClick={() => showPlaceholder('Help')}>
              <CircleHelp className="w-4 h-4" />
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg gap-2 text-destructive focus:text-destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppNavbar;
