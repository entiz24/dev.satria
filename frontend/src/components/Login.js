import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({ email, password });
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A1128] via-[#0F1A3D] to-[#1a2847] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7630006/pexels-photo-7630006.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>
      
      <Card className="relative z-10 w-full max-w-md mx-4 p-8 bg-card/95 backdrop-blur-xl border border-white/10 shadow-2xl" data-testid="login-card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 bg-white/5 p-4 rounded-lg">
            <img 
              src="/satria-logo.jpeg" 
              alt="SATRIA Logo" 
              className="h-28 w-28 object-contain"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-2">
            SATRIA
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Sistem Analitik Transaksi dan Intelijen Anti Pencucian Uang
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground block mb-2">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
              placeholder="user@satria.go.id"
              required
              data-testid="login-email-input"
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground block mb-2">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
              placeholder="••••••••"
              required
              data-testid="login-password-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200"
            disabled={loading}
            data-testid="login-submit-button"
          >
            {loading ? 'Memproses...' : 'Login'}
          </Button>
        </form>

        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Test Accounts:</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Admin:</span>
              <code className="font-mono text-foreground">admin@satria.go.id</code>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Password:</span>
              <code className="font-mono text-foreground">Admin123!</code>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
