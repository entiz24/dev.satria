import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { toast } from 'sonner';

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
    <div className="min-h-screen flex items-center justify-center bg-white" style={{
      backgroundImage: 'url(https://images.pexels.com/photos/3137073/pexels-photo-3137073.jpeg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div className="absolute inset-0 bg-white/90" />
      
      <Card className="relative z-10 w-full max-w-md p-8 border-2 border-[#0A0A0A] rounded-none" data-testid="login-card">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            SATRIA
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">
            Financial Intelligence System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold uppercase tracking-wide block mb-2">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-none border-2 focus:ring-2 focus:ring-black"
              required
              data-testid="login-email-input"
            />
          </div>

          <div>
            <label className="text-sm font-bold uppercase tracking-wide block mb-2">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-none border-2 focus:ring-2 focus:ring-black"
              required
              data-testid="login-password-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-none bg-[#002FA7] hover:bg-white hover:text-[#002FA7] hover:border-2 hover:border-[#002FA7] font-bold uppercase tracking-wide transition-all duration-75"
            disabled={loading}
            data-testid="login-submit-button"
          >
            {loading ? 'Memproses...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-[#F7F7F7] border border-[#E5E5E5]">
          <p className="text-xs font-bold uppercase tracking-wide mb-2">Test Accounts:</p>
          <p className="text-xs font-mono">admin@satria.go.id / Admin123!</p>
          <p className="text-xs font-mono">analyst@satria.go.id / Analyst123!</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
