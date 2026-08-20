'use client';

import { useState } from 'react';
import { evaluateSpin, generateGrid } from '@/lib/fortune-gems/engine';

export default function SimulatorPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [spinCount, setSpinCount] = useState(100000);

  const runSimulation = () => {
    setIsRunning(true);
    // Use setTimeout to allow UI to update to "Running..." before blocking thread
    setTimeout(() => {
      const betAmount = 10;
      let totalBet = 0;
      let totalPayout = 0;
      let winsCount = 0;
      let luckySpins = 0;
      let exTriggers = 0;
      let maxWin = 0;
      let totalJackpots = 0; // if we had a jackpot system, we'd check it here

      const startTime = performance.now();

      for (let i = 0; i < spinCount; i++) {
        totalBet += betAmount;
        const grid = generateGrid();
        const outcome = evaluateSpin(grid, betAmount);

        if (outcome.totalWinAmount > 0) {
          totalPayout += outcome.totalWinAmount;
          winsCount++;
          if (outcome.totalWinAmount > maxWin) {
            maxWin = outcome.totalWinAmount;
          }
        }
        if (outcome.luckySpinTriggered) luckySpins++;
        if (outcome.isExTriggered) exTriggers++;
        if (outcome.totalWinAmount >= betAmount * 500) totalJackpots++; // Simulated Grand Jackpot threshold
      }

      const endTime = performance.now();

      setReport({
        spins: spinCount,
        timeMs: endTime - startTime,
        totalBet,
        totalPayout,
        rtp: (totalPayout / totalBet) * 100,
        houseEdge: 100 - (totalPayout / totalBet) * 100,
        hitFrequency: (winsCount / spinCount) * 100,
        luckySpinsFreq: (luckySpins / spinCount) * 100,
        exTriggerFreq: (exTriggers / spinCount) * 100,
        jackpotFreq: (totalJackpots / spinCount) * 100,
        maxWinMultiplier: maxWin / betAmount,
      });

      setIsRunning(false);
    }, 50);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Fortune Gems RTP Simulator</h1>
      
      <div className="flex gap-4 items-center">
        <select 
          className="bg-gray-800 text-white p-2 rounded"
          value={spinCount}
          onChange={(e) => setSpinCount(Number(e.target.value))}
          disabled={isRunning}
        >
          <option value={10000}>10,000 Spins</option>
          <option value={100000}>100,000 Spins</option>
          <option value={1000000}>1,000,000 Spins</option>
          <option value={10000000}>10,000,000 Spins</option>
        </select>

        <button 
          onClick={runSimulation}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold disabled:opacity-50"
        >
          {isRunning ? 'Simulating...' : 'Run Simulation'}
        </button>
      </div>

      {report && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 font-mono text-sm space-y-2 text-green-400">
          <p className="text-white mb-4">Simulation completed in {(report.timeMs / 1000).toFixed(2)}s</p>
          <p>Spins:              {report.spins.toLocaleString()}</p>
          <p>Total Bet:          ₱{report.totalBet.toLocaleString()}</p>
          <p>Total Payout:       ₱{report.totalPayout.toLocaleString()}</p>
          <p className="text-yellow-400 font-bold mt-2">
            RTP:                {report.rtp.toFixed(2)}%
          </p>
          <p>House Edge:         {report.houseEdge.toFixed(2)}%</p>
          <p className="mt-2">Hit Frequency:      {report.hitFrequency.toFixed(2)}%</p>
          <p>Lucky Spins Freq:   {report.luckySpinsFreq.toFixed(3)}%</p>
          <p>EX Trigger Freq:    {report.exTriggerFreq.toFixed(3)}%</p>
          <p>Jackpots Freq:      {report.jackpotFreq.toFixed(5)}%</p>
          <p>Maximum Win:        {report.maxWinMultiplier}×</p>
        </div>
      )}
    </div>
  );
}
