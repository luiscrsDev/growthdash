'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

interface TrafficChartProps {
  data: number[]
  labels: string[]
}

export default function TrafficChart({ data, labels }: TrafficChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Traffic',
        data,
        borderColor: '#4ade80',
        backgroundColor: (context: { chart: ChartJS }) => {
          const ctx = context.chart.ctx
          const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height)
          gradient.addColorStop(0, 'rgba(74, 222, 128, 0.25)')
          gradient.addColorStop(1, 'rgba(74, 222, 128, 0.0)')
          return gradient
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#4ade80',
        pointHoverBorderColor: '#0f0f0f',
        pointHoverBorderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1a1a1a',
        borderColor: '#2a2a2a',
        borderWidth: 1,
        titleColor: '#9ca3af',
        bodyColor: '#4ade80',
        titleFont: {
          family: 'JetBrains Mono, monospace',
          size: 11,
        },
        bodyFont: {
          family: 'JetBrains Mono, monospace',
          size: 13,
          weight: 'bold' as const,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(42, 42, 42, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            family: 'JetBrains Mono, monospace',
            size: 10,
          },
          maxRotation: 0,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(42, 42, 42, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            family: 'JetBrains Mono, monospace',
            size: 10,
          },
          callback: (value: string | number) => {
            const num = typeof value === 'string' ? parseFloat(value) : value
            if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
            return value
          },
        },
        border: {
          display: false,
        },
      },
    },
  }

  return (
    <div className="w-full h-full min-h-[200px]">
      <Line data={chartData} options={options} />
    </div>
  )
}
