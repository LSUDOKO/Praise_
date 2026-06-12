import { NextRequest, NextResponse } from 'next/server'

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'
const FEE_RECIPIENT = process.env.X402_PAY_TO || '0x0000000000000000000000000000000000000000'
const CHAIN_ID = 421614

const SERVICE_PRICING: Record<string, { amount: string; description: string }> = {
  'venice-pr-review': {
    amount: '0.01',
    description: 'Venice AI PR Code Review',
  },
  'venice-spam-detection': {
    amount: '0.005',
    description: 'Venice AI Spam Detection',
  },
  'venice-sybil-detection': {
    amount: '0.005',
    description: 'Venice AI Sybil Detection',
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service, amount, payer } = body

    const config = SERVICE_PRICING[service]
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid service' },
        { status: 400 }
      )
    }

    const paymentRequest = {
      status: 402,
      title: 'Payment Required',
      amount: amount || config.amount,
      token: USDC_ADDRESS,
      chainId: CHAIN_ID,
      payee: FEE_RECIPIENT,
      description: config.description,
      amountWei: BigInt(Math.floor(parseFloat(amount || config.amount) * 10 ** 6)).toString(),
    }

    return NextResponse.json({ paymentRequest })
  } catch (error) {
    console.error('x402 payment error:', error)
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}
