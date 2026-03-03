import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export default async function proxy(request: NextRequest) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://eu.i.posthog.com https://eu-assets.i.posthog.com;
        style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com;
        img-src 'self' data: blob: https:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://*.supabase.co https://eu.i.posthog.com https://eu.posthog.com;
        frame-src 'self';
        worker-src 'self' blob:;
        object-src 'none';
        base-uri 'self';
    `.replace(/\s{2,}/g, ' ').trim()

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)
    requestHeaders.set('Content-Security-Policy', cspHeader)

    const response = await updateSession(request, requestHeaders)
    response.headers.set('Content-Security-Policy', cspHeader)

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
