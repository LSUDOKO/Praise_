'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { arbitrumSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'PRaise',
  projectId: 'praise-hackathon',
  chains: [arbitrumSepolia],
  ssr: true,
})
