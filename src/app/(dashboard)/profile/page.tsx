'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Lock, CheckCircle, AlertCircle, Eye, EyeOff,
  Pencil, Save, X, Shield, Coins, Trophy, LayoutGrid,
  Mail, Fingerprint, BadgeCheck, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { useWalletStore } from '@/lib/store/wallet';

function Alert({ type, text }: { type: 'success' | 'error'; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
        type === 'success'
          ? 'bg-green-50 border border-green-200 text-green-700'
          : 'bg-red-50 border border-red-200 text-red-600'
      }`}
    >
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />
      }
      {text}
    </motion.div>
  );
}

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
    >
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4">
        <span className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, id, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; id: string; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 pr-12 focus:outline-none transition-colors"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const textColors = ['', 'text-red-500', 'text-yellow-500', 'text-blue-500', 'text-green-600'];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      {score > 0 && <p className={`text-xs font-semibold ${textColors[score]}`}>{labels[score]}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUsername, updatePassword, logout } = useAuthStore();
  const { balance } = useWalletStore();

  const [nicknameEdit, setNicknameEdit] = useState(false);
  const [nickname, setNickname] = useState(user?.username ?? '');
  const [nicknameAlert, setNicknameAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwAlert, setPwAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const flash = (
    setter: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error'; text: string } | null>>,
    type: 'success' | 'error',
    text: string
  ) => { setter({ type, text }); setTimeout(() => setter(null), 4000); };

  const saveNickname = () => {
    const t = nickname.trim();
    if (!t) return flash(setNicknameAlert, 'error', 'Nickname cannot be empty.');
    if (t.length < 3) return flash(setNicknameAlert, 'error', 'At least 3 characters required.');
    if (t.length > 20) return flash(setNicknameAlert, 'error', 'Max 20 characters.');
    updateUsername(t);
    setNicknameEdit(false);
    flash(setNicknameAlert, 'success', 'Nickname updated!');
  };

  const savePassword = async () => {
    if (!newPw) return flash(setPwAlert, 'error', 'New password cannot be empty.');
    if (newPw !== confirmPw) return flash(setPwAlert, 'error', 'Passwords do not match.');
    const result = await updatePassword(currentPw, newPw);
    if (result.ok) {
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      flash(setPwAlert, 'success', 'Password changed successfully!');
    } else {
      flash(setPwAlert, 'error', result.error ?? 'Something went wrong.');
    }
  };

  const initial = (user?.username ?? 'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Account</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your profile and security settings.</p>
      </div>

      {/* Avatar + Stats card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-center gap-5"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-3xl font-black text-white shadow-lg">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
              : initial
            }
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white" />
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <p className="font-bold text-xl text-gray-800">{user?.username}</p>
          <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>

          {/* Stat pills */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
            {[
              { icon: Coins, label: `${balance.toLocaleString()} pts`, color: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: Trophy, label: '0 wins',   color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { icon: LayoutGrid, label: '0 games', color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map(({ icon: Icon, label, color, bg }) => (
              <div key={label} className={`flex items-center gap-1.5 ${bg} px-3 py-1.5 rounded-full`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className={`text-xs font-semibold ${color}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Logout button */}
      <motion.button 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => { logout(); router.push('/'); }}
        className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <LogOut className="w-4.5 h-4.5" />
        Log Out
      </motion.button>

      {/* Change Nickname */}
      <SectionCard title="Change Nickname" icon={<User className="w-4 h-4" />}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {nicknameEdit ? (
              <>
                <input
                  autoFocus
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') setNicknameEdit(false); }}
                  maxLength={20}
                  className="flex-1 bg-gray-50 border border-gray-200 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition-colors"
                  placeholder="Enter new nickname"
                />
                <button onClick={saveNickname} className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center hover:bg-purple-700 transition-colors">
                  <Save className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => { setNicknameEdit(false); setNickname(user?.username ?? ''); }} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800">
                  {user?.username}
                </div>
                <button onClick={() => setNicknameEdit(true)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <p className="text-[11px] text-gray-400">3–20 characters. Letters, numbers, underscores only.</p>
          <AnimatePresence>{nicknameAlert && <Alert type={nicknameAlert.type} text={nicknameAlert.text} />}</AnimatePresence>
        </div>
      </SectionCard>

      {/* Change Password */}
      <SectionCard title="Change Password" icon={<Lock className="w-4 h-4" />}>
        <div className="space-y-4">
          <PasswordField label="Current Password" value={currentPw} onChange={setCurrentPw} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} id="current-pw" />
          <PasswordField label="New Password" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew(v => !v)} id="new-pw" hint="At least 6 characters" />
          <PasswordField label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} id="confirm-pw" />
          {newPw && <PasswordStrength password={newPw} />}
          <AnimatePresence>{pwAlert && <Alert type={pwAlert.type} text={pwAlert.text} />}</AnimatePresence>
          <button onClick={savePassword} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors shadow-sm">
            Update Password
          </button>
        </div>
      </SectionCard>

      {/* Account Info */}
      <SectionCard title="Account Info" icon={<Shield className="w-4 h-4" />}>
        <div className="space-y-0 divide-y divide-gray-50">
          {[
            { icon: Mail,        label: 'Email',        value: user?.email ?? '—',  mono: false },
            { icon: Fingerprint, label: 'Account ID',   value: (user?.id ?? '—').slice(0, 18) + '…', mono: true  },
            { icon: BadgeCheck,  label: 'Account Type', value: 'Standard',          mono: false },
          ].map(({ icon: Icon, label, value, mono }) => (
            <div key={label} className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 font-medium">{label}</p>
                <p className={`text-sm font-semibold text-gray-800 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
