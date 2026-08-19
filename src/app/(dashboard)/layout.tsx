'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Wallet, History, User, LogOut, Gamepad2, Bell, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { useWalletStore } from '@/lib/store/wallet';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { name: 'Home', href: '/lobby', icon: Home },
  { name: 'Games', href: '/lobby#games', icon: Gamepad2 },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'History', href: '/history', icon: History },
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

  const isGame = pathname === '/super-ace';

  return (
    <div className="min-h-screen flex" style={{ background: '#f3f0ff' }}>

      {/* ── Left Sidebar ── */}
      <aside className="hidden md:flex flex-col w-52 bg-white border-r border-purple-100 sticky top-0 h-screen shadow-sm z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-purple-50">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Bingo Arena" className="w-9 h-9 rounded-xl object-cover shadow" />
            <span className="font-outfit font-black text-gray-800 text-base tracking-tight">BINGO ARENA</span>
          </div>
        </div>

        {/* User card */}
        <div className="px-4 py-3 border-b border-purple-50">
          <div className="bg-purple-50 rounded-xl p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white font-black text-sm shadow overflow-hidden">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                : <span>{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-xs truncate">{user?.username}</p>
              <p className="text-[10px] text-purple-600 font-semibold">⭐ {balance.toLocaleString()} pts</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href === '/lobby' && pathname === '/lobby');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-purple-50 space-y-0.5">
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors w-full text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        {!isGame && (
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
        <main className={`flex-1 ${isGame ? '' : 'overflow-y-auto'}`}>
          {children}
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
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

