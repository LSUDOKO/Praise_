'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, CheckCircle2, Shield, Sparkles } from 'lucide-react'

export function VeniceStatus() {
  const hasApiKey = !!process.env.NEXT_PUBLIC_VENICE_API_KEY

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[--brand-teal]" />
          Venice AI
        </CardTitle>
        <CardDescription>
          Privacy-first AI for code review and analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <span className="text-sm text-gray-400">API Connection</span>
          <Badge
            variant={hasApiKey ? 'default' : 'secondary'}
            className={hasApiKey ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
          >
            {hasApiKey ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <Shield className="h-3 w-3 mr-1" />
            )}
            {hasApiKey ? 'Connected' : 'Not Configured'}
          </Badge>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Capabilities</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" />
              PR Code Review
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" />
              Spam Detection
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" />
              Sybil Detection
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" />
              Security Analysis
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-blue-300">
              Privacy-first: Code is only seen by the AI, never trained on or stored
            </span>
          </div>
        </div>

        {/* Model Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Model</span>
          </div>
          <Badge variant="outline">venice-code-large</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
