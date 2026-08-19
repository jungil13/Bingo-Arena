'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Lock, CheckCircle, AlertCircle, Eye, EyeOff,
  Pencil, Save, X, Shield, Coins, Trophy, Star
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';

// ── small reusable alert ──────────────────────────────────────────────────────
function Alert({ type, text }: { type: 'success' | 'error'; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
        type === 'success'
          ? 'bg-green-500/10 border border-green-500/20 text-green-400'
          : 'bg-red-500/10 border border-red-500/20 text-red-400'
      }`}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {text}
    </motion.div>
  );
}

// ── section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-white/5 p-6"
    >
      <h2 className="flex items-center gap-2 text-base font-bold mb-5">
        <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUsername, updatePassword } = useAuthStore();

  // Nickname
  const [nicknameEdit, setNicknameEdit] = useState(false);
  const [nickname, setNickname] = useState(user?.username ?? '');
  const [nicknameAlert, setNicknameAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwAlert, setPwAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const flashAlert = (
    setter: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error'; text: string } | null>>,
    type: 'success' | 'error',
    text: string
  ) => {
    setter({ type, text });
    setTimeout(() => setter(null), 4000);
  };

  const saveNickname = () => {
    const trimmed = nickname.trim();
    if (!trimmed) return flashAlert(setNicknameAlert, 'error', 'Nickname cannot be empty.');
    if (trimmed.length < 3) return flashAlert(setNicknameAlert, 'error', 'Nickname must be at least 3 characters.');
    if (trimmed.length > 20) return flashAlert(setNicknameAlert, 'error', 'Nickname must be 20 characters or less.');
    updateUsername(trimmed);
    setNicknameEdit(false);
    flashAlert(setNicknameAlert, 'success', 'Nickname updated successfully!');
  };

  const savePassword = async () => {
    if (!newPw) return flashAlert(setPwAlert, 'error', 'New password cannot be empty.');
    if (newPw !== confirmPw) return flashAlert(setPwAlert, 'error', 'Passwords do not match.');
    const result = await updatePassword(currentPw, newPw);
    if (result.ok) {
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      flashAlert(setPwAlert, 'success', 'Password changed successfully!');
    } else {
      flashAlert(setPwAlert, 'error', result.error ?? 'Something went wrong.');
    }
  };

  const initial = (user?.username ?? 'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="font-outfit text-3xl font-bold mb-1">My Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your account settings.</p>
      </div>

      {/* ── Avatar + stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/5 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-black text-white shadow-[0_0_24px_rgba(176,38,255,0.5)]">
            {initial}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background" />
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <p className="font-outfit font-bold text-2xl">{user?.username}</p>
          <p className="text-muted-foreground text-sm mt-0.5">{user?.email}</p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
            <StatPill icon={<Coins className="w-3.5 h-3.5 text-gold" />} label="10,000" sub="coins" />
            <StatPill icon={<Trophy className="w-3.5 h-3.5 text-yellow-400" />} label="0" sub="wins" />
            <StatPill icon={<Star className="w-3.5 h-3.5 text-primary" />} label="0" sub="games" />
          </div>
        </div>
      </motion.div>

      {/* ── Change Nickname ── */}
      <SectionCard title="Change Nickname" icon={<User className="w-4 h-4" />}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {nicknameEdit ? (
              <>
                <input
                  autoFocus
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') setNicknameEdit(false); }}
                  maxLength={20}
                  className="flex-1 bg-background border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  placeholder="Enter new nickname"
                />
                <button
                  onClick={saveNickname}
                  className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Save className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => { setNicknameEdit(false); setNickname(user?.username ?? ''); }}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-sm font-medium">
                  {user?.username}
                </div>
                <button
                  onClick={() => setNicknameEdit(true)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground">3–20 characters. Letters, numbers, and underscores only.</p>

          <AnimatePresence>
            {nicknameAlert && <Alert type={nicknameAlert.type} text={nicknameAlert.text} />}
          </AnimatePresence>
        </div>
      </SectionCard>

      {/* ── Change Password ── */}
      <SectionCard title="Change Password" icon={<Lock className="w-4 h-4" />}>
        <div className="space-y-4">
          <PasswordField
            label="Current Password"
            value={currentPw}
            onChange={setCurrentPw}
            show={showCurrent}
            onToggle={() => setShowCurrent(v => !v)}
            id="current-pw"
          />
          <PasswordField
            label="New Password"
            value={newPw}
            onChange={setNewPw}
            show={showNew}
            onToggle={() => setShowNew(v => !v)}
            id="new-pw"
            hint="At least 6 characters"
          />
          <PasswordField
            label="Confirm New Password"
            value={confirmPw}
            onChange={setConfirmPw}
            show={showConfirm}
            onToggle={() => setShowConfirm(v => !v)}
            id="confirm-pw"
          />

          <AnimatePresence>
            {pwAlert && <Alert type={pwAlert.type} text={pwAlert.text} />}
          </AnimatePresence>

          {/* Strength bar */}
          {newPw && (
            <PasswordStrength password={newPw} />
          )}

          <button
            onClick={savePassword}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors shadow-[0_0_16px_rgba(176,38,255,0.2)] hover:shadow-[0_0_24px_rgba(176,38,255,0.4)]"
          >
            Update Password
          </button>
        </div>
      </SectionCard>

      {/* ── Account Info (read-only) ── */}
      <SectionCard title="Account Info" icon={<Shield className="w-4 h-4" />}>
        <div className="space-y-3">
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <InfoRow label="Account ID" value={user?.id ?? '—'} mono />
          <InfoRow label="Account Type" value="Standard" />
        </div>
      </SectionCard>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────
function StatPill({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full text-sm">
      {icon}
      <span className="font-bold">{label}</span>
      <span className="text-muted-foreground text-xs">{sub}</span>
    </div>
  );
}

function PasswordField({
  label, value, onChange, show, onToggle, id, hint
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; id: string; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-background border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm text-white pr-12 focus:outline-none transition-colors"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
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

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-400', 'bg-green-500'];
  const textColors = ['', 'text-red-400', 'text-yellow-400', 'text-blue-400', 'text-green-400'];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-white/10'}`}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-xs font-medium ${textColors[score]}`}>
          {labels[score]} password
        </p>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono text-xs text-muted-foreground' : ''}`}>
        {value}
      </span>
    </div>
  );
}
