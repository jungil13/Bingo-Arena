'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Wallet, History, User, LogOut, Gamepad2, Bell, ChevronRight, Users, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { useWalletStore } from '@/lib/store/wallet';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { name: 'Home', href: '/lobby', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Online', href: '/online-players', icon: Users },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Account', href: '/profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, syncFromSupabase } = useAuthStore();
  const { balance } = useWalletStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    syncFromSupabase().then(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        router.push('/login');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || !isAuthenticated) return null;

  const isGame = pathname === '/super-ace' || pathname === '/fortune-gems';
  const isChat = pathname === '/chat';

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#f3f0ff' }}>

      {/* ── Left Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-50/50 border-r border-zinc-200 sticky top-0 h-screen z-30">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-zinc-200 px-6">
          <Link href="/lobby" className="flex items-center gap-2 font-semibold">
            <img src="/logo.png" alt="Bingo Arena" className="w-6 h-6 rounded-md object-cover shadow-sm" />
            <span className="font-outfit tracking-tight text-zinc-900">Bingo Arena</span>
          </Link>
        </div>

        {/* User Profile */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                : <span className="text-sm font-medium text-zinc-600">{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
              }
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-zinc-900">{user?.username}</p>
              <p className="truncate text-xs text-zinc-500">{balance.toLocaleString()} pts</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href === '/lobby' && pathname === '/lobby');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-200 p-4">
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <LogOut className="w-4 h-4 text-zinc-400" />
            Logout
          </button>
          <div className="mt-4 px-3 text-xs text-zinc-400">
            developed by Jun Gil Casquejo
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        {!isGame && !isChat && (
          <header className="bg-white border-b border-purple-100 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center justify-between px-4 md:px-6 h-14">
              {/* Mobile logo */}
              <div className="flex md:hidden items-center gap-2">
                <img src="/logo.png" alt="Bingo Arena" className="w-7 h-7 rounded-lg object-cover shadow" />
                <span className="font-outfit font-black text-gray-800 text-sm tracking-tight">BINGO ARENA</span>
              </div>

              {/* Announcement ticker */}
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-lg overflow-hidden">
                <Bell className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-xs text-gray-500 whitespace-nowrap animate-marquee">
                    🎉 Welcome to Bingo Arena! Play Bingo and Super Ace to win big points!&nbsp;&nbsp;&nbsp;🏆 Daily bonuses available — claim yours now!
                  </p>
                </div>
              </div>

              {/* Right: balance + avatar */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full">
                  <span className="text-purple-500 text-sm">⭐</span>
                  <span className="font-bold text-purple-700 text-sm">{balance.toLocaleString()}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white font-black text-sm shadow overflow-hidden">
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                    : <span>{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
                  }
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page content */}
        <main className={`flex-1 min-h-0 ${isGame ? 'overflow-hidden flex flex-col' : isChat ? 'overflow-hidden flex flex-col' : 'overflow-y-auto pb-24'}`}>
          {children}
          {!isGame && !isChat && (
            <footer className="md:hidden py-6 text-center text-[10px] text-gray-400 border-t border-purple-100/50 mt-8">
              developed by Jun Gil Casquejo
            </footer>
          )}
        </main>

        {/* Mobile bottom nav */}
        {!isGame && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-purple-100 z-30 shadow-lg">
            <div className="flex items-stretch justify-around px-1 py-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl flex-1 transition-colors ${
                      isActive ? 'text-purple-600' : 'text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[9px] font-semibold">{item.name}</span>
                    {isActive && <div className="w-1 h-1 rounded-full bg-purple-500" />}
                  </Link>
                );
              })}
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl flex-1 transition-colors text-red-500 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-[9px] font-semibold">Logout</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

