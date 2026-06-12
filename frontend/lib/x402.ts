'use client'

import { encodeFunctionData, parseAbi } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'
const FEE_RECIPIENT = process.env.X402_PAY_TO || '0x0000000000000000000000000000000000000000'

export interface X402PaymentRequest {
  service: 'venice-pr-review' | 'venice-spam-detection' | 'venice-sybil-detection'
  amount: string
  description: string
}

export interface X402PaymentProof {
  txHash: string
  payer: string
  amount: string
  token: string
  chainId: number
}

export interface X402ProtectedResource {
  status: number
  title?: string
  amount?: string
  token?: string
  chainId?: number
  payee?: string
  description?: string
}

// Service pricing in USDC
export const X402_SERVICES: Record<X402PaymentRequest['service'], { amount: string; description: string }> = {
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

export async function fetchWithX402(
  url: string,
  options: RequestInit,
  signer?: any
): Promise<Response> {
  let response = await fetch(url, options)

  if (response.status === 402 && signer) {
    const paymentRequest: X402ProtectedResource = await response.json()

    if (!paymentRequest.amount || !paymentRequest.token || !paymentRequest.payee) {
      throw new Error('Invalid 402 payment request')
    }

    const txHash = await sendX402Payment(signer, {
      amount: paymentRequest.amount,
      token: paymentRequest.token,
      payee: paymentRequest.payee,
      chainId: paymentRequest.chainId || arbitrumSepolia.id,
    })

    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'x-payment-proof': txHash,
      },
    })
  }

  return response
}

async function sendX402Payment(
  signer: any,
  params: {
    amount: string
    token: string
    payee: string
    chainId: number
  }
): Promise<string> {
  const erc20Abi = parseAbi([
    'function transfer(address to, uint256 amount) returns (bool)',
  ])

  const decimals = 6
  const amountWei = BigInt(Math.floor(parseFloat(params.amount) * 10 ** decimals))

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [params.payee as `0x${string}`, amountWei],
  })

  const tx = await signer.sendTransaction({
    to: params.token as `0x${string}`,
    data,
    chainId: params.chainId,
  })

  return tx.hash
}

export function createX402Endpoint(
  service: X402PaymentRequest['service']
) {
  const config = X402_SERVICES[service]

  return async (req: Request): Promise<Response> => {
    const paymentProof = req.headers.get('x-payment-proof')

    if (!paymentProof || !(await verifyX402Payment(paymentProof))) {
      return Response.json(
        {
          status: 402,
          title: 'Payment Required',
          amount: config.amount,
          token: USDC_ADDRESS,
          chainId: arbitrumSepolia.id,
          payee: FEE_RECIPIENT,
          description: config.description,
        },
        { status: 402 }
      )
    }

    return new Response(null, { status: 200 })
  }
}

async function verifyX402Payment(proof: string): Promise<boolean> {
  try {
    return proof.startsWith('0x') && proof.length === 66
  } catch {
    return false
  }
}
