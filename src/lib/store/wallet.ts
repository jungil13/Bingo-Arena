import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  date: string;
}

interface WalletState {
  balance: number;
  transactions: Transaction[];
  lastRedeemed: string | null;
  addFunds: (amount: number, reason: string) => void;
  deductFunds: (amount: number, reason: string) => boolean; // Returns true if successful
  redeemDailyBonus: () => boolean;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 10400, // Initial balance
      transactions: [
        { id: 'tx-initial', type: 'credit' as const, amount: 10400, reason: 'Welcome Bonus', date: new Date().toISOString() }
      ],
      lastRedeemed: null,

      addFunds: (amount: number, reason: string) => {
        set((state) => ({
          balance: state.balance + amount,
          transactions: [
            {
              id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'credit' as const,
              amount,
              reason,
              date: new Date().toISOString()
            },
            ...state.transactions
          ].slice(0, 50) // Keep last 50 transactions
        }));
      },

      deductFunds: (amount: number, reason: string) => {
        const state = get();
        if (state.balance < amount) {
          return false; // Insufficient funds
        }
        
        set((state) => ({
          balance: state.balance - amount,
          transactions: [
            {
              id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'debit' as const,
              amount,
              reason,
              date: new Date().toISOString()
            },
            ...state.transactions
          ].slice(0, 50)
        }));
        return true;
      },

      redeemDailyBonus: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        
        if (state.lastRedeemed === today) {
          return false;
        }

        set((state) => ({
          balance: state.balance + 10000,
          lastRedeemed: today,
          transactions: [
            {
              id: `tx-${Date.now()}-bonus`,
              type: 'credit' as const,
              amount: 10000,
              reason: 'Daily Bonus',
              date: new Date().toISOString()
            },
            ...state.transactions
          ].slice(0, 50)
        }));
        return true;
      }
    }),
    {
      name: 'bingo-wallet-storage',
    }
  )
);
