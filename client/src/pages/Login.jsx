import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hexagon, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Paper Ledger login — a signed note on the desk. Tape strip, micro-tilt,
// hand-circled wordmark; the desk texture comes from body::before.
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="w-full max-w-sm animate-slide-up relative">
        {/* The note */}
        <div
          className="relative bg-card border border-border/60 px-8 pt-10 pb-8"
          style={{
            borderRadius: 4,
            rotate: '-0.6deg',
            boxShadow: '0 2px 4px hsl(34 30% 22% / 0.1), 0 18px 40px -12px hsl(34 35% 22% / 0.3)',
          }}
        >
          {/* Masking tape */}
          <div
            className="absolute -top-3 left-1/2 w-24 h-6 pointer-events-none"
            style={{
              translate: '-50% 0',
              rotate: '-2.5deg',
              background: 'hsl(47 60% 80% / 0.6)',
              borderLeft: '1px dashed hsl(40 30% 60% / 0.35)',
              borderRight: '1px dashed hsl(40 30% 60% / 0.35)',
              boxShadow: '0 1px 2px hsl(34 30% 22% / 0.12)',
            }}
          />

          {/* Wordmark */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary shadow-md mb-4">
              <Hexagon className="text-primary-foreground" size={24} />
            </div>
            <h1 className="text-display text-[32px]">
              <span className="hand-circle">Mavro</span>
            </h1>
            <p className="mt-2.5 text-caption">Operations Console</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-background/60 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="admin@mavro.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background/60 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="font-hand text-center text-[19px] text-muted-foreground/70 mt-5 rotate-[-1deg]">
          the whole operation, on one desk
        </p>
      </div>
    </div>
  );
}
