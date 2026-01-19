import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecognitionFeed from '../components/RecognitionFeed'

describe('RecognitionFeed', () => {
  it('renders no-data state', () => {
    render(<RecognitionFeed items={[]} />)
    expect(screen.getByText(/No recognitions yet/i)).toBeDefined()
  })

  it('renders a recognition card', () => {
    const item = {
      id: 'r1',
      sender_avatar: 'SS',
      sender_name: 'Suresh S',
      receiver_name: 'Priya P',
      badge_name: 'Team Player',
      points: 50,
      message: 'Great collaboration!',
      time_ago: '2h'
    }
    render(<RecognitionFeed items={[item]} />)
    expect(screen.getByText(/Suresh S/)).toBeDefined()
    expect(screen.getByText(/Priya P/)).toBeDefined()
    expect(screen.getByText(/Team Player/)).toBeDefined()
    expect(screen.getByText(/\+50 Points/)).toBeDefined()
    expect(screen.getByText(/Great collaboration!/)).toBeDefined()
  })
})
