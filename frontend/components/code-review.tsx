'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Brain, CheckCircle2, XCircle, AlertTriangle, Shield, Code } from 'lucide-react'
import { useVenice } from '@/hooks/use-venice'

interface CodeReviewProps {
  prUrl?: string
  issueUrl?: string
  onReviewComplete?: (score: number, approved: boolean) => void
}

export function CodeReview({ prUrl, issueUrl, onReviewComplete }: CodeReviewProps) {
  const {
    isReviewing,
    isDetectingSpam,
    lastReviewResult,
    lastSpamResult,
    error,
    reviewPR,
    checkSpam,
  } = useVenice()

  const [prTitle, setPrTitle] = useState('')
  const [prDescription, setPrDescription] = useState('')
  const [prDiff, setPrDiff] = useState('')
  const [issueTitle, setIssueTitle] = useState('')
  const [issueBody, setIssueBody] = useState('')

  const handleReview = async () => {
    if (!prTitle || !prDiff) return

    const result = await reviewPR({
      prDiff,
      issueTitle,
      issueBody,
      prTitle,
      prDescription,
    })

    // Also check for spam
    await checkSpam(prTitle, prDescription)

    onReviewComplete?.(result.score, result.score >= 80)
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[--brand-teal]" />
          Venice AI Code Review
        </CardTitle>
        <CardDescription>
          AI-powered PR review for bounty eligibility
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="space-y-4 p-4 rounded-lg bg-white/5">
          <h4 className="text-sm font-medium text-gray-300">PR Details</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prTitle">PR Title</Label>
              <Input
                id="prTitle"
                placeholder="Fix: resolve issue #42"
                value={prTitle}
                onChange={(e) => setPrTitle(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueTitle">Issue Title</Label>
              <Input
                id="issueTitle"
                placeholder="Bug: application crashes"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prDescription">PR Description</Label>
            <Textarea
              id="prDescription"
              placeholder="This PR fixes the crash by..."
              value={prDescription}
              onChange={(e) => setPrDescription(e.target.value)}
              className="bg-white/5 border-white/10 min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueBody">Issue Description</Label>
            <Textarea
              id="issueBody"
              placeholder="Steps to reproduce..."
              value={issueBody}
              onChange={(e) => setIssueBody(e.target.value)}
              className="bg-white/5 border-white/10 min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prDiff">Code Diff</Label>
            <Textarea
              id="prDiff"
              placeholder={`- const oldCode = 'old'
+ const newCode = 'new'`}
              value={prDiff}
              onChange={(e) => setPrDiff(e.target.value)}
              className="bg-white/5 border-white/10 min-h-[120px] font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleReview}
            disabled={!prTitle || !prDiff || isReviewing || isDetectingSpam}
            className="w-full bg-[--brand-teal] hover:bg-[--brand-teal]/80"
          >
            {isReviewing || isDetectingSpam ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isReviewing ? 'Reviewing with Venice AI...' : 'Checking for spam...'}
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Run AI Review
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Review Results */}
        {lastReviewResult && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Review Results</h4>
            
            {/* Score */}
            <div className="p-4 rounded-lg bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">AI Score</span>
                <Badge
                  variant={lastReviewResult.score >= 80 ? 'default' : 'secondary'}
                  className={lastReviewResult.score >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
                >
                  {lastReviewResult.score}/100
                </Badge>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${lastReviewResult.score >= 80 ? 'bg-green-400' : lastReviewResult.score >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${lastReviewResult.score}%` }}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-white/5">
              <h5 className="text-sm font-medium text-gray-300 mb-2">Summary</h5>
              <p className="text-sm text-gray-400">{lastReviewResult.summary}</p>
            </div>

            {/* Code Quality */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-sm text-gray-400">Code Quality</span>
              <Badge
                variant={
                  lastReviewResult.codeQuality === 'good' ? 'default' :
                  lastReviewResult.codeQuality === 'fair' ? 'secondary' : 'destructive'
                }
              >
                {lastReviewResult.codeQuality}
              </Badge>
            </div>

            {/* Issues */}
            {lastReviewResult.issues.length > 0 && (
              <div className="p-4 rounded-lg bg-white/5">
                <h5 className="text-sm font-medium text-gray-300 mb-2">Issues Found</h5>
                <ul className="space-y-1">
                  {lastReviewResult.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Security Issues */}
            {lastReviewResult.securityIssues.length > 0 && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <h5 className="text-sm font-medium text-red-300 mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security Issues
                </h5>
                <ul className="space-y-1">
                  {lastReviewResult.securityIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-400">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Spam Detection */}
            {lastSpamResult && (
              <div className={`p-4 rounded-lg ${lastSpamResult.isSpam ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {lastSpamResult.isSpam ? (
                    <XCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  )}
                  <span className={`text-sm font-medium ${lastSpamResult.isSpam ? 'text-red-300' : 'text-green-300'}`}>
                    {lastSpamResult.isSpam ? 'Spam Detected' : 'Not Spam'}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {lastSpamResult.confidence}% confidence
                  </Badge>
                </div>
                {lastSpamResult.isSpam && lastSpamResult.reasons.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {lastSpamResult.reasons.map((reason, i) => (
                      <li key={i} className="text-xs text-red-400">
                        - {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* AI Slop Warning */}
            {lastReviewResult.aiSlop && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-300">
                    AI-Generated Code Detected
                  </span>
                </div>
                <p className="text-xs text-yellow-400 mt-1">
                  This PR appears to contain AI-generated code patterns
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
