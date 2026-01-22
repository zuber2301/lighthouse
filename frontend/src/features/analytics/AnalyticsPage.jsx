import React from 'react'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import { ChartCard, BarChart, LineChartSVG } from '../../themes/templatemo_602_graph_page/ChartCard'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Recognition trends and redemption breakdown" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Monthly Trends" options={["2024","2023","2022"]}>
          <BarChart values={[120,180,90,140,200,130,150,170]} />
        </ChartCard>

        <ChartCard title="Growth Analytics" options={["Week","Month","Year"]}>
          <LineChartSVG pathD="M 0,200 L 62,180 L 125,150 L 187,170 L 250,120 L 312,140 L 375,100 L 437,130 L 500,110 L 500,300 L 0,300 Z" />
        </ChartCard>

        <ChartCard title="Geographic Distribution" options={["Global","US","EU"]}>
          <BarChart values={[85,65,45,25]} />
        </ChartCard>

        <ChartCard title="Device Analytics" options={["This Month","Last Month","YTD"]}>
          <LineChartSVG pathD="M 0,180 L 71,160 L 142,140 L 214,120 L 285,100 L 357,90 L 428,80 L 500,70" gradientId="g2" />
        </ChartCard>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Reports & Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <button type="button" className="bg-[rgba(255,255,255,0.03)] border border-white/6 rounded-xl p-4 text-center hover:-translate-y-1 transform transition-all duration-200 hover:shadow-sm-tm-neon focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-teal">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-tm-teal to-tm-teal-2 rounded-lg flex items-center justify-center text-tm-bg-dark text-xl">💼</div>
            <h3 className="text-lg font-semibold">Business Intelligence</h3>
            <div className="text-2xl font-bold mt-2">98.5%</div>
            <p className="text-sm opacity-70 text-text-main mt-2">Accuracy in predictive analytics and business forecasting models.</p>
          </button>

          <button type="button" className="bg-[rgba(255,255,255,0.03)] border border-white/6 rounded-xl p-4 text-center hover:-translate-y-1 transform transition-all duration-200 hover:shadow-sm-tm-neon focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-teal">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-tm-teal to-tm-teal-2 rounded-lg flex items-center justify-center text-tm-bg-dark text-xl">📱</div>
            <h3 className="text-lg font-semibold">Mobile Analytics</h3>
            <div className="text-2xl font-bold mt-2">2.4M</div>
            <p className="text-sm opacity-70 text-text-main mt-2">Mobile app downloads and active user engagement metrics.</p>
          </button>

          <button type="button" className="bg-[rgba(255,255,255,0.03)] border border-white/6 rounded-xl p-4 text-center hover:-translate-y-1 transform transition-all duration-200 hover:shadow-sm-tm-neon focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-teal">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-tm-teal to-tm-teal-2 rounded-lg flex items-center justify-center text-tm-bg-dark text-xl">🌍</div>
            <h3 className="text-lg font-semibold">Global Reach</h3>
            <div className="text-2xl font-bold mt-2">150+</div>
            <p className="text-sm opacity-70 text-text-main mt-2">Countries actively using our analytics platform worldwide.</p>
          </button>

          <button type="button" className="bg-[rgba(255,255,255,0.03)] border border-white/6 rounded-xl p-4 text-center hover:-translate-y-1 transform transition-all duration-200 hover:shadow-sm-tm-neon focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-teal">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-tm-teal to-tm-teal-2 rounded-lg flex items-center justify-center text-tm-bg-dark text-xl">🚀</div>
            <h3 className="text-lg font-semibold">Performance Index</h3>
            <div className="text-2xl font-bold mt-2">847</div>
            <p className="text-sm opacity-70 text-text-main mt-2">Comprehensive performance scoring across all platform metrics.</p>
          </button>
        </div>
      </div>
    </div>
  )
}
