import { NextRequest, NextResponse } from 'next/server'
import { removeTrendingGift, getTrendingGifts } from '../store'

// DELETE /api/trending-gifts/[id] - Remove a trending gift
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log(`[trending-gifts-api] DELETE request for gift ID: ${id}`)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Gift ID is required' },
        { status: 400 }
      )
    }
    
    const success = removeTrendingGift(id)
    
    if (!success) {
      console.log(`[trending-gifts-api] Gift not found: ${id}`)
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      )
    }
    
    console.log(`[trending-gifts-api] Successfully deleted gift: ${id}`)
    return NextResponse.json({ 
      success: true, 
      message: 'Gift removed from trending' 
    })
    
  } catch (error) {
    console.error('[trending-gifts-api] Error deleting gift:', error)
    return NextResponse.json(
      { error: 'Failed to delete gift' },
      { status: 500 }
    )
  }
}

// GET /api/trending-gifts/[id] - Get a single trending gift
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const gifts = getTrendingGifts()
    const gift = gifts.find(g => g.id === id)
    
    if (!gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ gift })
    
  } catch (error) {
    console.error('[trending-gifts-api] Error getting gift:', error)
    return NextResponse.json(
      { error: 'Failed to get gift' },
      { status: 500 }
    )
  }
}
