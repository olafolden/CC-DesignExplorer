'use client'

import { useRouter } from 'next/navigation'
import { Compass } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <Compass className="h-10 w-10 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Design Explorer</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            disabled
            className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground/50"
          />
          <input
            type="password"
            placeholder="Password"
            disabled
            className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Skip Login (Dev Mode)
        </button>

        <p className="text-center text-xs text-muted-foreground/60">
          Auth will be wired to Supabase in Phase 2
        </p>
      </div>
    </div>
  )
}
