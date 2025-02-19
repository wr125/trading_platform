'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import DateRangePicker from './DateRangePicker'

interface StockChartProps {
  symbol: string
  data?: any[]
  onDateRangeChange?: (startDate: Date, endDate: Date) => void
}

export default function StockChart({ symbol, data, onDateRangeChange }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState(new Date())

  useEffect(() => {
    if (!chartContainerRef.current || !data?.length) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'white' },
        textColor: 'black',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#E6E6E6' },
        horzLines: { color: '#E6E6E6' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    })

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    // Create volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set as overlay
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    // Format data for the chart
    const formattedData = data.map((item: any) => ({
      time: new Date(item.time).getTime() / 1000,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }))

    const volumeData = data.map((item: any) => ({
      time: new Date(item.time).getTime() / 1000,
      value: item.volume,
      color: item.close >= item.open ? '#26a69a' : '#ef5350',
    }))

    // Set the data
    candlestickSeries.setData(formattedData)
    volumeSeries.setData(volumeData)

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    chartRef.current = chart

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data])

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start)
    setEndDate(end)
    if (onDateRangeChange) {
      onDateRangeChange(start, end)
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{symbol} Chart</h2>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
        />
      </div>
      <div 
        ref={chartContainerRef} 
        className="w-full h-[400px]"
      />
    </div>
  )
} 