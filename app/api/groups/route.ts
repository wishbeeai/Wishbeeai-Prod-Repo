import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// In-memory storage for groups (temporary until database table is created)
// This will reset when the server restarts
// Using global to persist across hot reloads in development
const getGroupsStore = (): Map<string, any> => {
  if (!(global as any).__groupsStore) {
    (global as any).__groupsStore = new Map()
  }
  return (global as any).__groupsStore
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupData = await req.json()
    console.log("[v0] Creating group:", groupData)

    // Validate required fields
    if (!groupData.groupName || !groupData.memberEmails || groupData.memberEmails.length === 0) {
      return NextResponse.json({ error: "Group name and at least one member email are required" }, { status: 400 })
    }

    // Generate a unique ID
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create group object
    const group = {
      id: groupId,
      created_by: user.id,
      group_name: groupData.groupName,
      description: groupData.description || null,
      group_photo: groupData.groupPhoto || null,
      status: 'active',
      created_at: new Date().toISOString(),
      member_emails: groupData.memberEmails,
      member_count: groupData.memberEmails.length,
    }
    
    // Store in memory
    getGroupsStore().set(groupId, group)
    
    console.log("[v0] Group created successfully:", groupId)

    return NextResponse.json({
      success: true,
      id: groupId,
      group: {
        id: groupId,
        groupName: group.group_name,
        description: group.description,
        groupPhoto: group.group_photo,
        memberCount: group.member_count,
        status: group.status,
        createdDate: group.created_at,
        invitationsSent: true,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating group:", error)
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get groups from memory store for this user
    const userGroups: any[] = []
    getGroupsStore().forEach((group) => {
      if (group.created_by === user.id) {
        userGroups.push({
          id: group.id,
          groupName: group.group_name,
          description: group.description,
          groupPhoto: group.group_photo || '/images/groups.png',
          memberCount: group.member_count,
          memberEmails: group.member_emails,
          createdDate: group.created_at,
          status: group.status,
          isOwner: true,
        })
      }
    })

    // Sort by created date descending
    userGroups.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())

    return NextResponse.json({
      success: true,
      groups: userGroups,
    })
  } catch (error) {
    console.error("[v0] Error fetching groups:", error)
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 })
  }
}
