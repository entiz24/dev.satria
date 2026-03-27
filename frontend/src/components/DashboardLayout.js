import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Shield,
  Activity,
  LogOut,
  Briefcase,
  Database,
  Menu,
  X
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'analyst', 'regulator', 'auditor'] },
    { path: '/transactions', label: 'Transactions', icon: Activity, roles: ['admin', 'analyst', 'regulator'] },
    { path: '/entities', label: 'Entities', icon: Users, roles: ['admin', 'analyst', 'regulator'] },
    { path: '/cases', label: 'Cases', icon: Briefcase, roles: ['admin', 'analyst'] },
    { path: '/ltkm', label: 'LTKM Reports', icon: FileText, roles: ['admin', 'analyst', 'regulator'] },
    { path: '/alerts', label: 'Alerts', icon: AlertTriangle, roles: ['admin', 'analyst', 'regulator'] },
    { path: '/intelligence', label: 'Intelligence', icon: Shield, roles: ['admin', 'analyst', 'regulator'] },
    { path: '/audit', label: 'Audit Logs', icon: Database, roles: ['admin', 'auditor'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const NavLinks = ({ mobile = false }) => (
    <nav className={mobile ? "space-y-2" : "space-y-1"}>
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-md
              ${isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}\n            `}
            data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/10" data-testid="dashboard-header">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-card border-white/10 p-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground">SATRIA</h2>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Intelligence</p>
                </div>
                <NavLinks mobile={true} />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  SATRIA
                </h1>
                <p className="hidden sm:block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Financial Intelligence
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground">{user?.full_name}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{user?.role}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              data-testid="logout-button"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 min-h-[calc(100vh-4rem)] border-r border-white/10 bg-card/50" data-testid="sidebar">
          <div className="p-4 sm:p-6">
            <NavLinks />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8" data-testid="main-content">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
