import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// In-memory store for variants (use Redis in production)
const variantStore = new Map<string, { variants: Record<string, string>, url: string, timestamp: number }>()

// POST - Save variants from extension
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { variants, url, timestamp } = body

    if (!variants || typeof variants !== 'object') {
      return NextResponse.json({ error: 'Invalid variants data' }, { status: 400 })
    }

    // Store variants with user ID as key
    variantStore.set(user.id, {
      variants,
      url: url || '',
      timestamp: timestamp || Date.now()
    })

    // Auto-expire after 5 minutes
    setTimeout(() => {
      variantStore.delete(user.id)
    }, 5 * 60 * 1000)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[save-variants] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Retrieve variants for the modal
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stored = variantStore.get(user.id)
    
    if (!stored) {
      return NextResponse.json({ variants: null })
    }

    // Check if data is still fresh (within 5 minutes)
    if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
      variantStore.delete(user.id)
      return NextResponse.json({ variants: null })
    }

    // Clear after retrieval (one-time use)
    variantStore.delete(user.id)

    return NextResponse.json({
      variants: stored.variants,
      url: stored.url,
      timestamp: stored.timestamp
    })
  } catch (error) {
    console.error('[save-variants] GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
