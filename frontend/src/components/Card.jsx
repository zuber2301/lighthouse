import React from 'react'

export default function Card({ children, className = '' }) {
  return (
    <div className={`p-6 card-base text-text-main ${className}`}>
      {children}
    </div>
  )
}
