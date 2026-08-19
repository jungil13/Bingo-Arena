'use client';

import { motion } from 'framer-motion';
import { Grid, Clock } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

export default function MyCardsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-outfit text-3xl font-bold mb-2">My Bingo Cards</h1>
        <p className="text-muted-foreground">View your active and recently played cards.</p>
      </div>

      <div className="flex flex-col items-center justify-center p-12 glass-card rounded-3xl border border-dashed border-white/20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Grid className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">No Active Cards</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          You don't have any active Bingo cards right now. Join a room to get your cards and start playing!
        </p>
        <Link href="/lobby" className={buttonVariants({ size: "lg", className: "rounded-full bg-primary hover:bg-primary/90" })}>
          Go to Lobby
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="font-outfit text-2xl font-bold mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" /> Past Cards
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <PastCard room="Standard Room" date="Yesterday" result="Won" color="text-green-400" />
          <PastCard room="Beginner Room" date="2 days ago" result="Lost" color="text-red-400" />
        </div>
      </div>
    </div>
  );
}

function PastCard({ room, date, result, color }: { room: string, date: string, result: string, color: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg">{room}</h3>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded-full bg-white/5 ${color}`}>
          {result}
        </span>
      </div>
      
      {/* Mini Card Representation */}
      <div className="aspect-square bg-background/50 rounded-xl border border-white/5 p-2 grid grid-cols-5 gap-1 opacity-50">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className={`rounded-sm ${i === 12 ? 'bg-gold/30' : 'bg-white/10'}`} />
        ))}
      </div>
    </motion.div>
  );
}
