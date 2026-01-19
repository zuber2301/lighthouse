import React from 'react';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Activity" subtitle="Your journey and impact" />
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <span className="text-4xl mb-4">📜</span>
            <p className="text-lg">Your recent activity will appear here.</p>
            <p className="text-sm">Keep earning points and recognizing others!</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
