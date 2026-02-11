'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // We capture manually below
        capture_pageleave: true,
        // GDPR: Start with tracking opted out — enable only after consent
        opt_out_capturing_by_default: true,
        persistence: 'memory', // Don't persist until consent given
    })
}

/**
 * Check if the user has given analytics consent.
 * Reads from localStorage where a cookie banner would store the preference.
 */
function hasAnalyticsConsent(): boolean {
    if (typeof window === 'undefined') return false
    try {
        const consent = localStorage.getItem('etalon_analytics_consent')
        return consent === 'granted'
    } catch {
        return false
    }
}

/**
 * Call this from your cookie/consent banner when the user accepts analytics.
 */
export function grantAnalyticsConsent() {
    if (typeof window === 'undefined') return
    localStorage.setItem('etalon_analytics_consent', 'granted')
    posthog.opt_in_capturing()
}

/**
 * Call this from your cookie/consent banner when the user declines analytics.
 */
export function revokeAnalyticsConsent() {
    if (typeof window === 'undefined') return
    localStorage.setItem('etalon_analytics_consent', 'revoked')
    posthog.opt_out_capturing()
}

function PostHogPageView() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const posthog = usePostHog()

    // Restore consent state on mount
    useEffect(() => {
        if (hasAnalyticsConsent()) {
            posthog.opt_in_capturing()
        }
    }, [posthog])

    useEffect(() => {
        if (pathname && posthog) {
            let url = window.origin + pathname
            const search = searchParams.toString()
            if (search) {
                url += '?' + search
            }
            posthog.capture('$pageview', { $current_url: url })
        }
    }, [pathname, searchParams, posthog])

    return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        return <>{children}</>
    }

    return (
        <PHProvider client={posthog}>
            <Suspense fallback={null}>
                <PostHogPageView />
            </Suspense>
            {children}
        </PHProvider>
    )
}
