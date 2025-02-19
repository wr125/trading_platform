import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const alpacaResponse = await fetch(
      `${process.env.ALPACA_API_URL}/stocks/${symbol}/bars?timeframe=1D&start=${start}&end=${end}`,
      {
        headers: {
          'APCA-API-KEY-ID': process.env.NEXT_PUBLIC_ALPACA_API_KEY!,
          'APCA-API-SECRET-KEY': process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY!,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        cache: 'no-store'
      }
    )

    if (!alpacaResponse.ok) {
      const errorText = await alpacaResponse.text()
      console.error('Alpaca API error response:', errorText)
      throw new Error(`Alpaca API error: ${alpacaResponse.status} ${alpacaResponse.statusText}`)
    }

    const data = await alpacaResponse.json()
    
    if (!data.bars || !Array.isArray(data.bars)) {
      console.error('Unexpected data format:', data)
      throw new Error('Invalid data format received from Alpaca API')
    }

    // Transform the data to match the expected format
    const formattedData = data.bars.map((bar: any) => ({
      time: new Date(bar.t).getTime() / 1000, // Convert to Unix timestamp
      open: Number(bar.o),
      high: Number(bar.h),
      low: Number(bar.l),
      close: Number(bar.c),
      volume: Number(bar.v)
    }))

    return NextResponse.json({ results: formattedData })
  } catch (error: any) {
    console.error('Stock data fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch stock data', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 