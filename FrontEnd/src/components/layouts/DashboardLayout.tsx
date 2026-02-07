import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, Package, ClipboardList,
  BarChart3, MapPin, CheckCircle, LogOut, Menu, X,
  Truck, ChevronRight, Zap, Map,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Delivery Agents', path: '/admin/agents', icon: Users },
  { label: 'Scheduled Deliveries', path: '/admin/deliveries', icon: Package },
  { label: 'Assign Deliveries', path: '/admin/assign', icon: ClipboardList },
  { label: 'Reports & Analysis', path: '/admin/reports', icon: BarChart3 },
];

const agentNavItems = [
  { label: 'Dashboard', path: '/agent', icon: LayoutDashboard },
  { label: 'Optimize Route', path: '/agent/optimize', icon: Zap },
  { label: 'Map View', path: '/agent/map', icon: Map },
  { label: 'Assigned Route', path: '/agent/route', icon: MapPin },
  { label: 'Delivery Status', path: '/agent/status', icon: CheckCircle },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = user?.role === 'admin' ? adminNavItems : agentNavItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link to={user?.role === 'admin' ? '/admin' : '/agent'} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
              <Truck className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {sidebarOpen && (
              <span className="text-lg font-semibold text-sidebar-foreground">DeliverEase</span>
            )}
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link to={item.path} className={cn('sidebar-link', isActive && 'active')}>
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                    {sidebarOpen && isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-medium">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          <Button variant="ghost" onClick={handleLogout}
            className={cn(
              'mt-3 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              !sidebarOpen && 'justify-center'
            )}>
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn('flex-1 transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-20')}>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
