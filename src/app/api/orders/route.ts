import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${process.env.ALPACA_API_URL}/orders?status=all&limit=100`,
      {
        headers: {
          'APCA-API-KEY-ID': process.env.NEXT_PUBLIC_ALPACA_API_KEY!,
          'APCA-API-SECRET-KEY': process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY!,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch orders from Alpaca')
    }

    const orders = await response.json()
    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    )
  }
} 