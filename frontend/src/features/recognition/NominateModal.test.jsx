import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NominateModal from './NominateModal';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import api from '../../api/axiosClient';

// Mock the API client
vi.mock('../../api/axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: 'http://localhost:8000' }
  }
}));

// Mock lucide-react with simple components
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="icon-search" />,
  Heart: () => <div data-testid="icon-heart" />,
  MessageSquare: () => <div data-testid="icon-message" />,
  User: () => <div data-testid="icon-user" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  Smile: () => <div data-testid="icon-smile" />,
  Trophy: () => <div data-testid="icon-trophy" />,
  Award: () => <div data-testid="icon-award" />,
  Star: () => <div data-testid="icon-star" />,
  CheckCircle2: () => <div data-testid="icon-check" />,
  Medal: () => <div data-testid="icon-medal" />,
  Send: () => <div data-testid="icon-send" />,
  X: () => <div data-testid="icon-x" />,
  ChevronRight: () => <div data-testid="icon-chevron-right" />,
  ArrowLeft: () => <div data-testid="icon-arrow-left" />,
  Users: () => <div data-testid="icon-users" />,
  Check: () => <div data-testid="icon-check-simple" />,
  ShieldCheck: () => <div data-testid="icon-shield" />,
  Layout: () => <div data-testid="icon-layout" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  PartyPopper: () => <div data-testid="icon-party" />,
  FileText: () => <div data-testid="icon-file" />,
  Image: () => <div data-testid="icon-image" />
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </BrowserRouter>
);

describe('NominateModal - E-Card Flow', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: [{ id: 'user-1', name: 'Test User' }] });
  });

  const waitDebounce = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

  it('completes the full E-Card nomination flow', async () => {
    render(
      <NominateModal 
        open={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
        initialCategory="E-Card" 
      />, 
      { wrapper }
    );

    // STEP 1: Select Recipient
    const searchInput = screen.getByPlaceholderText(/Find teammate.../i);
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    // Wait for internal search logic
    await waitFor(() => {
      const userBtn = screen.getByText('Test User');
      fireEvent.click(userBtn);
    });

    // Click "Next Step"
    const nextBtn1 = screen.getByText('Next Step');
    fireEvent.click(nextBtn1);
    await waitDebounce();

    // STEP 2: Choose Design
    await waitFor(() => {
      expect(screen.getByText('Design E-Card')).toBeDefined();
    });

    // Click "Review Order"
    const reviewBtn = screen.getByText('Review Order');
    fireEvent.click(reviewBtn);
    await waitDebounce();

    // STEP 3: Review & Send
    await waitFor(() => {
      expect(screen.getByText('Review & Send')).toBeDefined();
    });

    // Click "Send Now"
    const sendBtn = screen.getByText('Send Now');
    fireEvent.click(sendBtn);
    await waitDebounce();

    // Verify onSubmit was called
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        nominee_id: 'user-1',
        value_tag: 'E-Card',
        ecard_design: 'Classic'
      }));
    });

    // Verify modal closed after submission
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates that at least one recipient is selected before advancing', async () => {
    render(
      <NominateModal 
        open={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
        initialCategory="E-Card" 
      />, 
      { wrapper }
    );

    const nextBtn = screen.getByText('Next Step');
    fireEvent.click(nextBtn);

    // Should stay on Step 1 if no recipient
    expect(screen.getByPlaceholderText(/Find teammate.../i)).toBeDefined();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
