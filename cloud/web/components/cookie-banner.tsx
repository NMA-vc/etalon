'use client'

import { useState, useEffect } from 'react'
import { grantAnalyticsConsent, revokeAnalyticsConsent } from './posthog-provider'

type ConsentState = 'pending' | 'granted' | 'revoked'

export function CookieBanner() {
    const [consent, setConsent] = useState<ConsentState>('pending')
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('etalon_analytics_consent')
        if (stored === 'granted' || stored === 'revoked') {
            setConsent(stored)
        } else {
            // Show banner after a short delay for better UX
            const timer = setTimeout(() => setVisible(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    function handleAccept() {
        setConsent('granted')
        setVisible(false)
        grantAnalyticsConsent()
    }

    function handleDecline() {
        setConsent('revoked')
        setVisible(false)
        revokeAnalyticsConsent()
    }

    // Don't render if consent already given or not yet shown
    if (consent !== 'pending' || !visible) return null

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-500"
            role="dialog"
            aria-label="Cookie consent"
        >
            <div className="mx-auto max-w-4xl px-4 pb-4">
                <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl shadow-black/20 p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-medium mb-1">
                                🍪 We value your privacy
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                We use analytics cookies (PostHog) to understand how you use ETALON
                                and improve our product. No data is shared with third parties.
                                See our{' '}
                                <a href="/privacy" className="underline hover:text-foreground transition-colors">
                                    Privacy Policy
                                </a>{' '}
                                and{' '}
                                <a href="/cookies" className="underline hover:text-foreground transition-colors">
                                    Cookie Policy
                                </a>.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleDecline}
                                className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAccept}
                                className="px-4 py-2 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
