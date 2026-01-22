'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Users,
  Gift,
  Calendar,
  Mail,
  UserPlus,
  Settings,
  Share2,
  Loader2,
  Crown,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface GroupMember {
  email: string
  role: 'admin' | 'member'
  status: 'active' | 'pending' | 'declined'
}

interface Group {
  id: string
  groupName: string
  description?: string
  groupPhoto?: string
  memberCount: number
  memberEmails: string[]
  createdDate: string
  status: string
  isOwner: boolean
}

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGroup()
  }, [groupId])

  const fetchGroup = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch group')
      }

      if (data.success && data.group) {
        setGroup(data.group)
      } else {
        throw new Error('Group not found')
      }
    } catch (err) {
      console.error('Error fetching group:', err)
      setError(err instanceof Error ? err.message : 'Failed to load group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/groups/${groupId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: group?.groupName || 'Group',
          text: `Join our group: ${group?.groupName}`,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('🐝 Link copied!', {
        style: { background: 'linear-gradient(to right, #FEF3C7, #FDE68A, #F4C430)', color: '#654321', border: '2px solid #DAA520' }
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#8B4513]">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading group...
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/groups"
            className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Groups
          </Link>

          <div className="bg-white rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-[#654321] mb-2">Group Not Found</h1>
            <p className="text-[#8B4513]/70 mb-6">{error || 'This group does not exist or you do not have access.'}</p>
            <Link
              href="/groups"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] font-semibold rounded-full hover:scale-105 transition-all"
            >
              View All Groups
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </Link>

        {/* Group Header */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden mb-6">
          {/* Cover/Photo */}
          <div className="h-48 bg-gradient-to-r from-[#DAA520] to-[#F4C430] relative">
            {group.groupPhoto && (
              <img
                src={group.groupPhoto}
                alt={group.groupName}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleShare}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              {group.isOwner && (
                <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Group Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[#654321] mb-1">{group.groupName}</h1>
                <div className="flex items-center gap-4 text-sm text-[#8B4513]/70">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created {new Date(group.createdDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {group.isOwner && (
                <span className="flex items-center gap-1 px-2 py-1 bg-[#DAA520]/10 text-[#DAA520] text-xs font-semibold rounded-full">
                  <Crown className="w-3 h-3" />
                  Owner
                </span>
              )}
            </div>

            {group.description && (
              <div 
                className="text-[#654321] prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: group.description }}
              />
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-[#DAA520]/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#654321] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#DAA520]" />
              Members ({group.memberCount})
            </h2>
            
            {group.isOwner && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] text-xs font-semibold rounded-full hover:scale-105 transition-all">
                <UserPlus className="w-3.5 h-3.5" />
                Invite
              </button>
            )}
          </div>

          <div className="space-y-3">
            {group.memberEmails.map((email, index) => (
              <div
                key={email}
                className="flex items-center justify-between p-3 bg-[#F5F1E8] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center text-white font-semibold">
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-[#654321]">{email}</p>
                    <p className="text-xs text-[#8B4513]/70">
                      {index === 0 ? 'Admin' : 'Member'}
                    </p>
                  </div>
                </div>
                
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/gifts/create?groupId=${groupId}`}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-[#DAA520]/20 hover:border-[#DAA520] transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E65C00] to-[#F9A825] flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-[#654321]">Start Gift Collection</p>
              <p className="text-xs text-[#8B4513]/70">Create a group gift</p>
            </div>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-[#DAA520]/20 hover:border-[#DAA520] transition-all text-left"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-[#654321]">Share Group</p>
              <p className="text-xs text-[#8B4513]/70">Invite more people</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
