import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Shield,
  Activity,
  LogOut,
  Briefcase,
  Database
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="h-16 border-b-2 border-[#0A0A0A] bg-white flex items-center justify-between px-8" data-testid="dashboard-header">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            SATRIA
          </h1>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Financial Intelligence
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-bold">{user?.full_name}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{user?.role}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="rounded-none border-2 border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all duration-75"
            data-testid="logout-button"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] border-r-2 border-[#0A0A0A] bg-[#F7F7F7]" data-testid="sidebar">
          <nav className="p-4">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 mb-1 font-semibold text-sm uppercase tracking-wide transition-all duration-75
                    ${isActive 
                      ? 'bg-[#002FA7] text-white border-2 border-[#0A0A0A]' 
                      : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'}
                  `}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
