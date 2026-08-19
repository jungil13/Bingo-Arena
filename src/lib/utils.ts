import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  return 'http://localhost:3000';
}

const LEFT_GAMES_KEY = 'bingo-left-games';

export function markGameAsLeft(roomId: string) {
  if (typeof window === 'undefined') return;
  const existing = localStorage.getItem(LEFT_GAMES_KEY);
  const games = existing ? JSON.parse(existing) : [];
  if (!games.includes(roomId)) {
    games.push(roomId);
    localStorage.setItem(LEFT_GAMES_KEY, JSON.stringify(games));
  }
}

export function hasLeftGame(roomId: string): boolean {
  if (typeof window === 'undefined') return false;
  const existing = localStorage.getItem(LEFT_GAMES_KEY);
  const games = existing ? JSON.parse(existing) : [];
  return games.includes(roomId);
}
