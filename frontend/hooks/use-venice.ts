'use client'

import { useState, useCallback } from 'react'
import {
  reviewPRDiff,
  detectSpam,
  detectSybil,
  VeniceReviewRequest,
  VeniceReviewResult,
  SpamDetectionResult,
  SybilDetectionResult,
} from '@/lib/venice'

export interface VeniceState {
  isReviewing: boolean
  isDetectingSpam: boolean
  isDetectingSybil: boolean
  lastReviewResult: VeniceReviewResult | null
  lastSpamResult: SpamDetectionResult | null
  lastSybilResult: SybilDetectionResult | null
  error: string | null
}

export function useVenice() {
  const [state, setState] = useState<VeniceState>({
    isReviewing: false,
    isDetectingSpam: false,
    isDetectingSybil: false,
    lastReviewResult: null,
    lastSpamResult: null,
    lastSybilResult: null,
    error: null,
  })

  const reviewPR = useCallback(async (request: VeniceReviewRequest): Promise<VeniceReviewResult> => {
    setState(prev => ({ ...prev, isReviewing: true, error: null }))

    try {
      const result = await reviewPRDiff(request)
      setState(prev => ({
        ...prev,
        isReviewing: false,
        lastReviewResult: result,
      }))
      return result
    } catch (err) {
      console.error('PR review failed:', err)
      const errorResult: VeniceReviewResult = {
        score: 0,
        issues: ['Review failed'],
        summary: 'Unable to complete review',
        spam: false,
        aiSlop: false,
        securityIssues: [],
        codeQuality: 'fair',
      }
      setState(prev => ({
        ...prev,
        isReviewing: false,
        lastReviewResult: errorResult,
        error: err instanceof Error ? err.message : 'PR review failed',
      }))
      return errorResult
    }
  }, [])

  const checkSpam = useCallback(async (
    prTitle: string,
    prDescription: string,
    contributorHistory?: string
  ): Promise<SpamDetectionResult> => {
    setState(prev => ({ ...prev, isDetectingSpam: true, error: null }))

    try {
      const result = await detectSpam(prTitle, prDescription, contributorHistory)
      setState(prev => ({
        ...prev,
        isDetectingSpam: false,
        lastSpamResult: result,
      }))
      return result
    } catch (err) {
      console.error('Spam detection failed:', err)
      const errorResult: SpamDetectionResult = {
        isSpam: false,
        confidence: 0,
        reasons: ['Detection failed'],
      }
      setState(prev => ({
        ...prev,
        isDetectingSpam: false,
        lastSpamResult: errorResult,
        error: err instanceof Error ? err.message : 'Spam detection failed',
      }))
      return errorResult
    }
  }, [])

  const checkSybil = useCallback(async (
    contributorAddress: string,
    githubUsername: string,
    prCount: number,
    accountAge: number
  ): Promise<SybilDetectionResult> => {
    setState(prev => ({ ...prev, isDetectingSybil: true, error: null }))

    try {
      const result = await detectSybil(contributorAddress, githubUsername, prCount, accountAge)
      setState(prev => ({
        ...prev,
        isDetectingSybil: false,
        lastSybilResult: result,
      }))
      return result
    } catch (err) {
      console.error('Sybil detection failed:', err)
      const errorResult: SybilDetectionResult = {
        isSybil: false,
        confidence: 0,
        indicators: ['Detection failed'],
      }
      setState(prev => ({
        ...prev,
        isDetectingSybil: false,
        lastSybilResult: errorResult,
        error: err instanceof Error ? err.message : 'Sybil detection failed',
      }))
      return errorResult
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isReviewing: false,
      isDetectingSpam: false,
      isDetectingSybil: false,
      lastReviewResult: null,
      lastSpamResult: null,
      lastSybilResult: null,
      error: null,
    })
  }, [])

  return {
    ...state,
    reviewPR,
    checkSpam,
    checkSybil,
    reset,
  }
}
