import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Reference to the in-memory store from the main groups route
// In a real app, this would be a database query
const getGroupsStore = () => {
  // Access the global store
  return (global as any).__groupsStore || new Map()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get group from in-memory store
    const groupsStore = getGroupsStore()
    const group = groupsStore.get(id)

    if (!group) {
      return NextResponse.json({ 
        success: false,
        error: 'Group not found' 
      }, { status: 404 })
    }

    // Check if user has access
    if (group.created_by !== user.id) {
      // Check if user is a member
      const isMember = group.member_emails?.some(
        (email: string) => email.toLowerCase() === user.email?.toLowerCase()
      )
      
      if (!isMember) {
        return NextResponse.json({ 
          success: false,
          error: 'You do not have access to this group' 
        }, { status: 403 })
      }
    }

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        groupName: group.group_name,
        description: group.description,
        groupPhoto: group.group_photo || '/images/groups.png',
        memberCount: group.member_count,
        memberEmails: group.member_emails || [],
        createdDate: group.created_at,
        status: group.status,
        isOwner: group.created_by === user.id,
      },
    })
  } catch (error) {
    console.error('[v0] Error fetching group:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch group' 
    }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupsStore = getGroupsStore()
    const group = groupsStore.get(id)

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Only owner can delete
    if (group.created_by !== user.id) {
      return NextResponse.json({ error: 'Only the group owner can delete this group' }, { status: 403 })
    }

    groupsStore.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    })
  } catch (error) {
    console.error('[v0] Error deleting group:', error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
