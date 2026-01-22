import React from 'react'

export default function ThemeHero() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl bg-gradient-to-br from-tm-bg-dark to-surface">
      <div className="flex-1">
        <h1 className="text-2xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-tm-teal">Data Analytics Dashboard</h1>
        <p className="text-text-main/60 mt-2 max-w-xl">Transform your data into actionable insights with real-time monitoring and beautiful visualizations.</p>
        <button className="inline-block mt-4 px-4 py-2 rounded-full font-semibold bg-gradient-to-r from-tm-pink to-tm-orange text-white shadow-tm-neon focus:outline-none focus-visible:ring-3 focus-visible:ring-tm-teal" aria-label="Get Started">Get Started</button>
      </div>

      <div className="flex-1 w-full md:w-auto">
        <div className="h-36 md:h-40 rounded-lg bg-gradient-to-b from-[#0f1329] to-[#0a0e27] border border-indigo-500/10" aria-hidden />
      </div>
    </div>
  )
}
