import { NextRequest, NextResponse } from 'next/server'
import { restClient } from '@polygon.io/client-js'

export async function GET(request: NextRequest) {
  try {
    const rest = restClient(process.env.NEXT_PUBLIC_POLYGON_API_KEY!)
    const response = await rest.stocks.snapshotAllTickers()

    if (response.status !== 'OK') {
      throw new Error('Failed to fetch market data')
    }

    const filteredData = response.tickers
      .filter(ticker => ticker.todaysChangePerc !== 0)
      .sort((a, b) => b.todaysChangePerc - a.todaysChangePerc)

    return NextResponse.json({ results: filteredData })
  } catch (error: any) {
    console.error('Market snapshot error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data',
        details: error.message 
      },
      { status: 500 }
    )
  }
} 