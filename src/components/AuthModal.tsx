import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'admin'>('customer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            phone,
            role,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Registration failed. Please try again.');
          setLoading(false);
          return;
        }

        setSuccessMsg('Account created successfully!');
        setTimeout(() => {
          onAuthSuccess(data.user, data.token);
          onClose();
        }, 500);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Invalid email or password.');
          setLoading(false);
          return;
        }

        setSuccessMsg('Signed in successfully!');
        setTimeout(() => {
          onAuthSuccess(data.user, data.token);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (demoType: 'customer' | 'admin') => {
    setMode('login');
    setError(null);
    if (demoType === 'customer') {
      setEmail('rahul@bazaaro.in');
      setPassword('Customer@123');
    } else {
      setEmail('admin@bazaaro.in');
      setPassword('Admin@123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-bazaaro-surface rounded-2xl max-w-md w-full shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-200 font-bold text-sm">
              ब
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-slate-100">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </h3>
              <p className="text-xs text-slate-400">Welcome to Bazaaro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-700/50 text-xs font-semibold bg-slate-900/50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3.5 border-b-2 text-center transition-all cursor-pointer ${
              mode === 'login'
                ? 'border-slate-400 text-slate-100 bg-slate-800/30 font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3.5 border-b-2 text-center transition-all cursor-pointer ${
              mode === 'register'
                ? 'border-slate-400 text-slate-100 bg-slate-800/30 font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-900/20 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl focus:border-slate-500 outline-hidden transition-colors"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Phone Number (+91)</label>
                  <div className="relative flex rounded-xl">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-700 bg-slate-800/30 text-slate-400 text-xs">
                      +91
                    </span>
                    <input
                      type="text"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-r-xl focus:border-slate-500 outline-hidden transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Account Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        role === 'customer'
                          ? 'border-slate-500 bg-slate-700 text-slate-100'
                          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        role === 'admin'
                          ? 'border-slate-500 bg-slate-700 text-slate-100'
                          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl focus:border-slate-500 outline-hidden transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl focus:border-slate-500 outline-hidden transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {mode === 'register' && (
                <p className="text-[10px] text-slate-400 mt-1.5">Minimum 6 characters.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-white disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span>Please wait...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Helper */}
          <div className="pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" /> Demo Credentials:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => fillDemoCredentials('customer')}
                className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
              >
                <strong className="text-slate-200 block font-medium">Customer</strong>
                <span className="text-slate-400 text-[11px]">rahul@bazaaro.in</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
              >
                <strong className="text-slate-200 block font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Admin
                </strong>
                <span className="text-slate-400 text-[11px]">admin@bazaaro.in</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
