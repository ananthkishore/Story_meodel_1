import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi, getErrorMessage } from '../services/api.js';

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await authApi[isRegister ? 'register' : 'login'](values);
      signIn(data.data);
      toast.success(isRegister ? 'Your workspace is ready.' : 'Welcome back.');
      navigate('/', { replace: true });
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-story-panel">
        <Link to="/login" className="flex items-center gap-3"><span className="brand-mark !bg-white !text-brand-600"><Sparkles size={20} fill="currentColor" /></span><span className="text-lg font-bold tracking-tight text-white">StoryCraft <span className="text-indigo-200">AI</span></span></Link>
        <div className="auth-panel-content">
          <div className="auth-kicker"><Sparkles size={14} /> Less blank-page energy</div>
          <h1>Make good ideas<br />ready for <span>the team.</span></h1>
          <p>Transform product context into focused, testable user stories your team can actually build.</p>
          <div className="auth-quote"><div className="flex items-center gap-2 text-indigo-100"><Sparkles size={15} className="text-amber-300" /><span className="text-xs font-semibold">A thoughtful first draft</span></div><p>Keep the product context, user needs, and acceptance criteria connected from the very first story.</p><div className="mt-4 grid grid-cols-3 gap-2 text-[9px] font-medium text-indigo-100"><span className="rounded-lg bg-white/10 px-2 py-2">Real context</span><span className="rounded-lg bg-white/10 px-2 py-2">Clear roles</span><span className="rounded-lg bg-white/10 px-2 py-2">Testable criteria</span></div></div>
        </div>
        <div className="auth-glow auth-glow-one" /><div className="auth-glow auth-glow-two" />
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="mb-9 lg:hidden"><Link to="/login" className="flex items-center gap-2"><span className="brand-mark"><Sparkles size={18} fill="currentColor" /></span><span className="font-bold text-ink">StoryCraft <span className="text-brand-600">AI</span></span></Link></div>
          <span className="auth-eyebrow">{isRegister ? 'START YOUR WORKSPACE' : 'WELCOME BACK'}</span>
          <h2>{isRegister ? 'Create your account' : 'Sign in to StoryCraft'}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{isRegister ? 'A better backlog starts with one idea.' : 'Your product workspace is right where you left it.'}</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            {isRegister && <label className="form-label">Full name<input className="field-control mt-2" autoComplete="name" required minLength={2} maxLength={80} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="Alex Morgan" /></label>}
            <label className="form-label">Email address<input className="field-control mt-2" type="email" autoComplete="email" required value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@company.com" /></label>
            <label className="form-label">Password<span className="relative mt-2 block"><input className="field-control pr-12" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : undefined} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="At least 8 characters" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowPassword((show) => !show)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            <button disabled={busy} className="button-primary !mt-7 w-full justify-center !py-3.5">{busy ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}<ArrowRight size={16} /></button>
          </form>
          <p className="mt-7 text-center text-sm text-muted">{isRegister ? 'Already have an account?' : 'New to StoryCraft?'} <Link className="font-semibold text-brand-600 hover:text-brand-700" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
          <p className="mt-10 text-center text-[11px] leading-5 text-slate-400">Your projects are private to your account. By continuing, you agree to use StoryCraft responsibly.</p>
        </div>
      </div>
    </div>
  );
}
