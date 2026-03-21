import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, customHeaders?: Headers) {
    return NextResponse.next({
        request: {
            headers: customHeaders || request.headers,
        },
    })
}
