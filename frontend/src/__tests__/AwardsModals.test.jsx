import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NominateModal from '../features/recognition/NominateModal';
import GroupAwardModal from '../features/recognition/GroupAwardModal';
import api from '../api/axiosClient';
import groupApi from '../lib/api';

// Mock the API clients
vi.mock('../api/axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: 'http://localhost:8000' }
  }
}));

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

import axiosClient from '../api/axiosClient';
import libApi from '../lib/api';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

describe('Recognition & Award Modals', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for NominateModal recipients
    axiosClient.get.mockResolvedValue({ data: [] });
    libApi.get.mockResolvedValue({ data: {} });
  });

  describe('Individual Award (NominateModal)', () => {
    it('should complete the individual award flow', async () => {
      axiosClient.get.mockResolvedValue({ data: [{ id: 'user-1', name: 'John Doe', email: 'john@example.com' }] });

      render(
        <NominateModal 
          open={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          initialCategory="Individual award" 
        />
      );

      // Step 1: Select Recipient
      fireEvent.change(screen.getByPlaceholderText(/Search by name or email/i), { target: { value: 'John' } });
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('John Doe'));
      fireEvent.click(screen.getByText('Next'));

      // Step 2: Message & Area of Focus
      fireEvent.change(screen.getByPlaceholderText(/Why does this person deserve recognition/i), { target: { value: 'Great job!' } });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Innovation' } });
      fireEvent.click(screen.getByText('Next'));

      // Step 3: Review & Send
      expect(screen.getByText(/Review & Send/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText('Send'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          nominee_id: 'user-1',
          value_tag: 'Individual award',
          area_of_focus: 'Innovation'
        }));
      });
    });
  });

  describe('E-Card (NominateModal)', () => {
    it('should complete the E-Card flow with design selection', async () => {
      axiosClient.get.mockResolvedValue({ data: [{ id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' }] });

      render(
        <NominateModal 
          open={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          initialCategory="E-Card" 
        />
      );

      // Step 1: Select Recipient
      fireEvent.change(screen.getByPlaceholderText(/Search by name or email/i), { target: { value: 'Jane' } });
      await waitFor(() => expect(screen.getByText('Jane Smith')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Jane Smith'));
      fireEvent.click(screen.getByText('Next'));

      // Step 2: Design Selection & Message
      fireEvent.change(screen.getByPlaceholderText(/Why does this person deserve recognition/i), { target: { value: 'You rock!' } });
      const designSelect = screen.getByDisplayValue('Classic');
      fireEvent.change(designSelect, { target: { value: 'Modern' } });
      fireEvent.click(screen.getByText('Next'));

      // Step 3: Review & Send
      fireEvent.click(screen.getByText('Send'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          value_tag: 'E-Card',
          ecard_design: 'Modern'
        }));
      });
    });
  });

  describe('Group Award (GroupAwardModal)', () => {
    it('should complete the group award flow with budget validation', async () => {
      // GroupRecipientPool uses axiosClient for searching
      // GroupAwardModal uses axiosClient for budget
      axiosClient.get.mockImplementation((url) => {
        if (url.includes('/user/search')) return Promise.resolve({ data: [{ id: 'user-3', name: 'Alpha Team Member' }] });
        if (url.includes('/lead/budget')) return Promise.resolve({ data: { budget_balance: 100000 } });
        return Promise.resolve({ data: [] });
      });

      render(
        <GroupAwardModal 
          open={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
        />
      );

      // Step 1: Select Recipients (using the pool search)
      // Note: GroupRecipientPool uses it's own search logic, let's look for the input
      const searchInputs = screen.getAllByPlaceholderText(/Search by name or email/i);
      const searchInput = searchInputs[searchInputs.length - 1]; // Use last one if multiple
      fireEvent.change(searchInput, { target: { value: 'Alpha' } });
      
      await waitFor(() => expect(screen.getByText(/Alpha Team Member/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText(/Alpha Team Member/i));
      fireEvent.click(screen.getByText('Next'));

      // Step 2: Award Level
      // Default is Bronze - 300. Let's try to set Gold - 1000 (if it exists) 
      // or just keep default and move next
      fireEvent.click(screen.getByText('Next'));

      // Step 3: Message & Send
      fireEvent.change(screen.getByPlaceholderText(/Describe the team's accomplishment/i), { target: { value: 'Team success' } });
      fireEvent.click(screen.getByText('Send'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          type: 'group',
          award_level: 'Bronze - 300'
        }));
      });
    });

    it('should show error if budget is exceeded', async () => {
      axiosClient.get.mockImplementation((url) => {
        if (url.includes('/user/search')) return Promise.resolve({ data: [{ id: 'user-3', name: 'Member 1' }, { id: 'user-4', name: 'Member 2' }] });
        if (url.includes('/lead/budget')) return Promise.resolve({ data: { budget_balance: 50000 } }); // 500 rupees
        return Promise.resolve({ data: [] });
      });

      render(
        <GroupAwardModal 
          open={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
        />
      );

      // Add two members
      const searchInputs = screen.getAllByPlaceholderText(/Search by name or email/i);
      const searchInput = searchInputs[searchInputs.length - 1];
      fireEvent.change(searchInput, { target: { value: 'Member' } });
      await waitFor(() => expect(screen.getByText(/Member 1/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText(/Member 1/i));
      fireEvent.click(screen.getByText(/Member 2/i));
      fireEvent.click(screen.getByText('Next'));

      // 2 members * 300 points = 600 points. Budget is 500.
      fireEvent.click(screen.getByText('Next'));
      
      expect(screen.getByText(/Insufficient lead budget/i)).toBeInTheDocument();
    });
  });
});
