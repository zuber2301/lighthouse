import React from 'react';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Leaderboard" subtitle="Top contributors this month" />
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <span className="text-4xl mb-4">🏆</span>
            <p className="text-lg">The leaderboard is being calculated.</p>
            <p className="text-sm">Check back soon to see where you stand!</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
