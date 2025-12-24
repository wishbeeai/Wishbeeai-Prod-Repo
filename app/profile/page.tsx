'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Calendar } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name)
    } else if (user?.email) {
      // Extract name from email (e.g., kavitha.segar@gmail.com -> Kavitha Segar)
      const emailName = user.email.split('@')[0]
      const formattedName = emailName
        .split('.')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      setDisplayName(formattedName)
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-xl text-[#8B4513]">Please sign in to view your profile.</p>
        </div>
        <Footer />
      </div>
    )
  }

  const memberSince = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'Recently'

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-[#8B4513] mb-8">
            My Profile
          </h1>

          <Card className="border-[#DAA520]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#8B4513]">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your Wishbee account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#8B4513]">
                  Display Name
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="border-[#DAA520]/30"
                  />
                ) : (
                  <p className="text-lg font-medium text-[#654321]">{displayName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[#8B4513]">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <p className="text-lg text-[#654321]">{user.email}</p>
              </div>

              {/* Member Since */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[#8B4513]">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </Label>
                <p className="text-lg text-[#654321]">{memberSince}</p>
              </div>

              {/* Edit Button */}
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsEditing(false)}
                    className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] hover:from-[#F4C430] hover:to-[#DAA520]"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-[#DAA520]/30"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-[#DAA520]/30 text-[#8B4513]"
                >
                  Edit Profile
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
