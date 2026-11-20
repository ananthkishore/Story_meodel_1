import { useState } from 'react';
import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const initials = user?.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <div className="mx-auto max-w-[850px] space-y-6">
    <div><p className="section-eyebrow">PREFERENCES</p><h1 className="page-title mt-1">Settings</h1><p className="mt-2 text-sm text-muted">Manage your account and keep your workspace secure.</p></div>
    <section className="settings-card"><div className="settings-heading"><span className="settings-icon"><UserRound size={18} /></span><div><h2>Account profile</h2><p>Your StoryCraft account information.</p></div></div><div className="mt-5 flex items-center gap-4 rounded-2xl bg-slate-50 p-4"><span className="avatar !h-12 !w-12 !text-base">{initials}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{user?.name}</p><p className="truncate text-xs text-muted">{user?.email}</p></div><span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">ACTIVE</span></div><p className="mt-3 text-xs leading-5 text-slate-400">Account profile editing is not enabled. Your email and display name are used to identify your private workspace.</p></section>
    <section className="settings-card"><div className="settings-heading"><span className="settings-icon !bg-emerald-50 !text-emerald-600"><ShieldCheck size={18} /></span><div><h2>Privacy & security</h2><p>Your work belongs to your account.</p></div></div><div className="mt-5 space-y-3"><div className="security-row"><span><b>Private projects</b><small>Only your signed-in account can access its projects and stories.</small></span><ShieldCheck size={17} className="text-emerald-500" /></div><div className="security-row"><span><b>Secure sign-in</b><small>Your password is protected with a one-way password hash.</small></span><ShieldCheck size={17} className="text-emerald-500" /></div></div></section>
    <section className="settings-card"><div className="settings-heading"><span className="settings-icon !bg-rose-50 !text-rose-500"><LogOut size={18} /></span><div><h2>Sign out</h2><p>End this session on this device.</p></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">You can sign back in whenever you’re ready.</p>{confirming ? <div className="flex items-center gap-2"><span className="text-xs text-slate-500">Sign out now?</span><button className="button-secondary !py-2" onClick={() => setConfirming(false)}>Cancel</button><button className="button-danger" onClick={() => { toast.success('Signed out.'); signOut(); }}>Sign out</button></div> : <button className="button-secondary !text-rose-600" onClick={() => setConfirming(true)}><LogOut size={15} />Sign out</button>}</div></section>
  </div>;
}
