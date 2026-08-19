"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Shield, Coins, Sparkles, ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAuthStore } from "@/lib/store/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, syncFromSupabase } = useAuthStore();

  useEffect(() => {
    syncFromSupabase().then(() => {
      if (useAuthStore.getState().isAuthenticated) {
        router.push('/lobby');
      }
    });
  }, [router, syncFromSupabase]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="logo" className="rounded-full w-10 h-10" />{" "}
          <span className="font-outfit font-bold text-2xl tracking-tight neon-text-purple">
            BINGO ARENA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants(),
              "rounded-full bg-primary hover:bg-primary/90 text-white font-medium px-6",
            )}
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-24 text-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>The ultimate virtual bingo experience</span>
          </div>

          <h1 className="font-outfit text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Play Modern <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Multiplayer Bingo
            </span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Join rooms, mark your cards, and shout BINGO! Experience the thrill
            of real-time multiplayer gaming with virtual coins. No real money
            required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full w-full sm:w-auto px-8 h-14 text-lg bg-primary hover:bg-primary/90",
              )}
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              Play Now Free
            </Link>
            <Link
              href="/lobby"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "rounded-full w-full sm:w-auto px-8 h-14 text-lg border-white/10 hover:bg-white/5",
              )}
            >
              View Lobby
            </Link>
          </div>
        </motion.div>

        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-black/40 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-outfit text-3xl md:text-4xl font-bold mb-4">
              Why Play Bingo Arena?
            </h2>
            <p className="text-muted-foreground">
              Everything you love about Bingo, upgraded for the modern web.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Coins className="w-8 h-8 text-gold" />}
              title="10,000 Free Coins"
              description="Start playing instantly with a generous welcome bonus. No deposits, no real money—just pure fun."
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8 text-primary" />}
              title="Real-Time Multiplayer"
              description="Compete against players worldwide. When numbers are drawn, everyone sees them at the exact same time."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-accent" />}
              title="Provably Fair"
              description="Server-side number generation and automated winner validation ensures every game is 100% fair."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-white/5 bg-background">
        <p>© 2026 Bingo Arena Prototype. All rights reserved.</p>
        <p className="mt-2 text-xs opacity-60">
          This is a play-money prototype only. No real money gambling.
        </p>
        <p className="mt-3 text-xs text-primary/80">
          developed by Jun Gil Casquejo
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card p-8 rounded-2xl flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="font-outfit text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
