import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Mail, Lock, AlertCircle, User, Shield } from 'lucide-react';

type LoginType = 'admin' | 'agent';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<LoginType>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate(loginType === 'admin' ? '/admin' : '/agent');
    } else {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  const fillDemoCredentials = () => {
    if (loginType === 'admin') {
      setEmail('admin@delivery.com');
      setPassword('admin123');
    } else {
      setEmail('agent@delivery.com');
      setPassword('agent123');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/20" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
              <Truck className="h-8 w-8 text-accent-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-primary-foreground">DeliverEase</h1>
          </div>
          <h2 className="text-3xl xl:text-4xl font-semibold text-primary-foreground mb-6 leading-tight">
            Scheduled Delivery<br />Management System
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Optimize your delivery routes with intelligent algorithms. 
            Reduce costs, save time, and improve customer satisfaction.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="bg-primary-foreground/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold text-primary-foreground">27%</div>
              <div className="text-sm text-primary-foreground/70">Average Distance Saved</div>
            </div>
            <div className="bg-primary-foreground/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold text-primary-foreground">33%</div>
              <div className="text-sm text-primary-foreground/70">Time Optimization</div>
            </div>
          </div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/10" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/5" />
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">DeliverEase</h1>
          </div>

          {/* Role selector */}
          <div className="flex gap-2 mb-8 p-1 bg-muted rounded-xl">
            <button
              onClick={() => { setLoginType('admin'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                loginType === 'admin'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </button>
            <button
              onClick={() => { setLoginType('agent'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                loginType === 'agent'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4" />
              Delivery Agent
            </button>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl">
                {loginType === 'admin' ? 'Admin Login' : 'Agent Login'}
              </CardTitle>
              <CardDescription>
                Enter your credentials to access the {loginType === 'admin' ? 'admin' : 'delivery agent'} dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm animate-fade-in">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-11 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
