import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Get the origin from the request
  const origin = req.headers.get('origin')
  
  // Set CORS headers
  res.headers.set('Access-Control-Allow-Origin', origin ?? '*')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: res.headers })
  }
  
  return res
}

export const config = {
  matcher: '/api/:path*',
}

