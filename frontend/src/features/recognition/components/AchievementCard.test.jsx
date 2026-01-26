import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AchievementCard from './AchievementCard';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Heart: () => 'HeartIcon',
  MessageSquare: () => 'MessageIcon',
  User: () => 'UserIcon',
  Calendar: () => 'CalendarIcon',
  Smile: () => 'SmileIcon',
  Trophy: () => 'TrophyIcon',
  Award: () => 'AwardIcon',
  Star: () => 'StarIcon',
  CheckCircle2: () => 'CheckIcon',
  Medal: () => 'MedalIcon',
  ThumbsUp: () => 'ThumbsUpIcon',
  Send: () => 'SendIcon'
}));

const mockData = {
  id: '1',
  message: 'Test message piece of work!',
  nominator_name: 'John Doe',
  nominee_name: 'Jane Smith',
  points: 500,
  award_category: 'GOLD',
  high_five_count: 5,
  created_at: new Date().toISOString()
};

describe('AchievementCard', () => {
  it('renders correctly with gold award', () => {
    render(<AchievementCard data={mockData} />, { wrapper });
    
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Jane Smith')).toBeDefined();
    expect(screen.getByText(/Test message piece of work!/)).toBeDefined();
    expect(screen.getByText(/Gold/i)).toBeDefined();
    expect(screen.getByText('5')).toBeDefined(); // High five count
  });

  it('renders silver award correctly', () => {
    const silverData = { ...mockData, award_category: 'SILVER', points: 250 };
    render(<AchievementCard data={silverData} />, { wrapper });
    expect(screen.getByText(/Silver/i)).toBeDefined();
  });

  it('renders bronze award correctly', () => {
    const bronzeData = { ...mockData, award_category: 'BRONZE', points: 100 };
    render(<AchievementCard data={bronzeData} />, { wrapper });
    expect(screen.getByText(/Bronze/i)).toBeDefined();
  });
});
