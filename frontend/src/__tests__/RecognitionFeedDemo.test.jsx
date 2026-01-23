import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecognitionFeedDemo from '../pages/RecognitionFeedDemo'

describe('RecognitionFeedDemo', () => {
  it('renders demo title and sample items', () => {
    render(<RecognitionFeedDemo />)
    expect(screen.getByText(/Wall of Fame/i)).toBeDefined()
    expect(screen.getByText(/Suresh S/)).toBeDefined()
    expect(screen.getByText(/Alex B/)).toBeDefined()
  })
})
