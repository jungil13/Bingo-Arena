'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Wallet, History, User, Settings, LogOut, Grid } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';

const NAV_ITEMS = [
  { name: 'Lobby', href: '/lobby', icon: Home },
  { name: 'My Cards', href: '/my-cards', icon: Grid },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'History', href: '/history', icon: History },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, syncFromSupabase } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Restore session from Supabase on every mount
    syncFromSupabase().then(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        router.push('/login');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-card/50 p-6 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2 mb-12">
          <img src="/logo.png" alt="Bingo Arena" className="w-9 h-9 rounded-xl object-cover" />
          <span className="font-outfit font-bold tracking-tight text-lg">BINGO ARENA</span>
        </div>

        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium text-sm">{user?.username}</p>
              <p className="text-xs text-muted-foreground">⭐ Points</p>
            </div>
          </div>

          <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
          <button 
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-background sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Bingo Arena" className="w-8 h-8 rounded-xl object-cover" />
            <span className="font-outfit font-bold tracking-tight">BINGO ARENA</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-white/5 pb-safe z-30">
        <div className="flex items-center justify-around p-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-lg min-w-[64px] ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`p-1.5 rounded-full mb-1 ${isActive ? 'bg-primary/20' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      
    </div>
  );
}
