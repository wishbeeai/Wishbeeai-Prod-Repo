"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  ArrowLeft,
  Users,
  X,
  Mail,
  Brain,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Palette,
  Upload,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [groupType, setGroupType] = useState("")
  const [memberEmails, setMemberEmails] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isGeneratingName, setIsGeneratingName] = useState(false)
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false)
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false)
  const [isSuggestingMembers, setIsSuggestingMembers] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const router = useRouter()

  const applyFormatting = (command: string) => {
    document.execCommand(command, false)
    if (editorRef.current) {
      setDescription(editorRef.current.innerText)
    }
  }

  const applyAlignment = (alignment: string) => {
    document.execCommand(alignment, false)
  }

  const applyList = (type: string) => {
    if (type === "bullet") {
      document.execCommand("insertUnorderedList", false)
    } else {
      document.execCommand("insertOrderedList", false)
    }
  }

  const applyColor = (color: string) => {
    document.execCommand("foreColor", false, color)
    setShowColorPicker(false)
  }

  const applyFontSize = (size: string) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const span = document.createElement("span")
      span.style.fontSize = size

      try {
        range.surroundContents(span)
      } catch (e) {
        console.log("Could not apply font size")
      }
    }
  }

  const insertEmoji = (emoji: string) => {
    document.execCommand("insertText", false, emoji)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
  }

  const addEmail = () => {
    if (emailInput && emailInput.includes("@") && !memberEmails.includes(emailInput)) {
      setMemberEmails([...memberEmails, emailInput])
      setEmailInput("")
      toast.success(`Added ${emailInput} to the group`)
    } else if (memberEmails.includes(emailInput)) {
      toast.error("Email already added")
    } else {
      toast.error("Please enter a valid email")
    }
  }

  const removeEmail = (email: string) => {
    setMemberEmails(memberEmails.filter((e) => e !== email))
    toast.info(`Removed ${email}`)
  }

  const handleGetSmartSuggestions = async () => {
    if (!groupType) {
      toast.error("Please select a group type first")
      return
    }

    setIsGettingSuggestions(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const suggestions = {
        family: {
          name: "Family Gift Circle",
          description:
            "A warm, close-knit group for celebrating family milestones, birthdays, and special occasions together. Share the joy of giving with those who matter most.",
          members: ["mom.smith@example.com", "dad.smith@example.com", "sister.jane@example.com"],
        },
        friends: {
          name: "Friends Forever Fund",
          description:
            "Your squad's go-to platform for group gifts! Celebrate friendships, special moments, and create lasting memories through thoughtful collective gifting.",
          members: ["sarah.johnson@example.com", "mike.davis@example.com", "emily.chen@example.com"],
        },
        coworkers: {
          name: "Workplace Appreciation Team",
          description:
            "Professional gifting made easy! Honor colleagues' achievements, celebrate work milestones, and strengthen team bonds through coordinated group gifts.",
          members: ["alex.wilson@example.com", "jordan.lee@example.com", "taylor.brown@example.com"],
        },
        community: {
          name: "Community Care Collective",
          description:
            "Unite your community through the power of giving. Support local causes, celebrate community heroes, and make a difference together.",
          members: ["community.leader@example.com", "volunteer1@example.com", "neighbor@example.com"],
        },
      }

      const suggestion = suggestions[groupType as keyof typeof suggestions] || suggestions.friends

      // Fill text fields
      if (!groupName) setGroupName(suggestion.name)
      if (!description && editorRef.current) {
        editorRef.current.innerText = suggestion.description
        setDescription(suggestion.description)
      }
      const newEmails = suggestion.members.filter((email) => !memberEmails.includes(email))
      if (newEmails.length > 0) {
        setMemberEmails([...memberEmails, ...newEmails])
      }

      // Generate group photo automatically
      try {
        const imageResponse = await fetch("/api/ai/generate-group-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupName: suggestion.name,
            description: suggestion.description,
          }),
        })

        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          setImagePreview(imageData.imageUrl)
        }
      } catch (imageError) {
        console.error("Error generating image:", imageError)
        // Don't show error to user, just skip the image generation
      }

      toast.success("AI filled all fields with smart suggestions including a group photo!")
    } catch (error) {
      toast.error("Failed to generate suggestions")
    } finally {
      setIsGettingSuggestions(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!groupName.trim()) {
      toast.error("Please enter a group name")
      return
    }

    if (memberEmails.length === 0) {
      toast.error("Please add at least one member to the group")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupName,
          description,
          groupPhoto: imagePreview,
          memberEmails,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create group")
      }

      console.log("[v0] Group created successfully:", data)

      toast.success(`Group "${groupName}" created successfully!`, {
        description: `Invitations sent to ${memberEmails.length} members`,
        action: {
          label: "View Groups",
          onClick: () => router.push("/groups"),
        },
      })

      // Wait a moment before redirecting
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push("/groups")
    } catch (error) {
      console.error("[v0] Error creating group:", error)
      toast.error("Failed to create group. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEnhanceDescription = async () => {
    if (!editorRef.current?.innerText.trim()) {
      toast.error("Please enter a description first")
      return
    }

    setIsEnhancingDescription(true)
    try {
      const response = await fetch("/api/ai/enhance-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editorRef.current.innerText,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to enhance description")
      }
      
      if (editorRef.current) {
        editorRef.current.innerHTML = data.enhancedDescription
        setDescription(data.enhancedDescription)
      }
      toast.success("Description enhanced with AI!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to enhance description"
      toast.error(message)
      console.error("[v0] Error enhancing description:", error)
    } finally {
      setIsEnhancingDescription(false)
    }
  }

  const handleGeneratePhoto = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name first")
      return
    }

    setIsGeneratingName(true) // Reuse loading state
    try {
      const response = await fetch("/api/ai/generate-group-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName,
          description: editorRef.current?.innerText || "A friendly group",
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to generate photo")
      }
      
      setImagePreview(data.imageUrl)
      toast.success("Group photo generated with AI!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate photo"
      toast.error(message)
      console.error("[v0] Error generating photo:", error)
    } finally {
      setIsGeneratingName(false)
    }
  }

  const handleSmartMembers = async () => {
    setIsSuggestingMembers(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const suggestions = ["john.doe@example.com", "jane.smith@example.com", "bob.wilson@example.com"]

      const newEmails = suggestions.filter((email) => !memberEmails.includes(email))
      if (newEmails.length > 0) {
        setMemberEmails([...memberEmails, ...newEmails])
        toast.success(`Added ${newEmails.length} smart member suggestions!`)
      } else {
        toast.info("No new member suggestions found")
      }
    } catch (error) {
      toast.error("Failed to get member suggestions")
    } finally {
      setIsSuggestingMembers(false)
    }
  }

  const handleOccasionDetection = () => {
    toast.success("🎉 AI detected upcoming occasions: Sarah's Birthday (Mar 15), John's Work Anniversary (Mar 20)")
  }

  const handleGroupInsights = () => {
    toast.success(
      "📊 AI Insights: High engagement group • Average contribution: $45 • Best time to post: Weekdays 7-9 PM",
    )
  }

  const handleContributionPatterns = () => {
    toast.success(
      "💡 Predictive Analysis: Members typically contribute within 48 hours • Peak contribution day: Thursday",
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors font-medium text-xs sm:text-sm"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Back to Groups
        </Link>

        <div className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex flex-row items-center justify-center gap-2">
              <Users className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#DAA520] flex-shrink-0 mt-0.5" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground whitespace-nowrap">
                Create New Group
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground text-center mt-2">
              Build your group with AI assistance and smart member management
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#654321] mb-2">Group Type *</label>
              <select
                value={groupType}
                onChange={(e) => setGroupType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] transition-colors text-[#654321] text-xs sm:text-sm md:text-base"
                required
              >
                <option value="">Select group type</option>
                <option value="family">Family</option>
                <option value="friends">Friends</option>
                <option value="coworkers">Coworkers</option>
                <option value="community">Community</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#654321] mb-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                Group Name *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Family Circle, Work Friends, College Squad"
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] transition-colors text-[#654321] text-xs sm:text-sm md:text-base"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#654321]">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                  Description *
                </label>
                <button
                  type="button"
                  onClick={handleEnhanceDescription}
                  disabled={isEnhancingDescription || !editorRef.current?.innerText.trim()}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white text-[9px] sm:text-xs font-semibold rounded-full border-2 border-amber-400/30 shadow-[0_4px_15px_rgba(251,146,60,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isEnhancingDescription ? "animate-spin" : ""}`} />
                  {isEnhancingDescription ? "Enhancing..." : "AI Enhance"}
                </button>
              </div>

              <div className="border-2 border-border rounded-lg overflow-hidden">
                {/* Formatting Toolbar */}
                <div className="bg-gray-200 border-b-2 border-gray-300 px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-1 sm:gap-2 flex-wrap">
                  <div className="flex items-center gap-0.5 sm:gap-1 border-r-2 border-gray-400 pr-1.5 sm:pr-3">
                    <Button
                      type="button"
                      onClick={() => {
                        applyFormatting("bold")
                        setIsBold(!isBold)
                      }}
                      className={`p-1 sm:p-2.5 rounded-lg transition-all ${
                        isBold
                          ? "bg-gray-400 text-gray-600 shadow-md"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-600 shadow-sm"
                      }`}
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        applyFormatting("italic")
                        setIsItalic(!isItalic)
                      }}
                      className={`p-1 sm:p-2.5 rounded-lg transition-all ${
                        isItalic
                          ? "bg-gray-400 text-gray-600 shadow-md"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-600 shadow-sm"
                      }`}
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        applyFormatting("underline")
                        setIsUnderline(!isUnderline)
                      }}
                      className={`p-1 sm:p-2.5 rounded-lg transition-all ${
                        isUnderline
                          ? "bg-gray-400 text-gray-600 shadow-md"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-600 shadow-sm"
                      }`}
                      title="Underline (Ctrl+U)"
                    >
                      <Underline className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 border-r-2 border-gray-400 pr-1.5 sm:pr-3">
                    <Button
                      type="button"
                      onClick={() => applyAlignment("justifyLeft")}
                      className="p-1 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Align Left"
                    >
                      <AlignLeft className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => applyAlignment("justifyCenter")}
                      className="p-1 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Align Center"
                    >
                      <AlignCenter className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => applyAlignment("justifyRight")}
                      className="p-1 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Align Right"
                    >
                      <AlignRight className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 border-r-2 border-gray-400 pr-1.5 sm:pr-3">
                    <Button
                      type="button"
                      onClick={() => applyList("bullet")}
                      className="p-1 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Bullet List"
                    >
                      <List className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => applyList("numbered")}
                      className="p-1 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 border-r-2 border-gray-400 pr-1.5 sm:pr-3 relative">
                    <Button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-1 sm:p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                      title="Text Color"
                    >
                      <Palette className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                    </Button>
                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-400 rounded-lg shadow-xl p-3 z-10 grid grid-cols-5 gap-2">
                        {["#000000", "#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#2563EB", "#9333EA", "#DB2777"].map(
                          (color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => applyColor(color)}
                              className="w-8 h-8 rounded-md border-2 border-gray-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <select
                      onChange={(e) => applyFontSize(e.target.value)}
                      className="px-1.5 py-1 sm:px-2 sm:py-1.5 text-xs sm:text-sm border-2 border-gray-300 rounded-lg bg-white text-slate-600 hover:bg-slate-100 transition-colors"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Size
                      </option>
                      <option value="12px">Small</option>
                      <option value="16px">Normal</option>
                      <option value="20px">Large</option>
                      <option value="24px">X-Large</option>
                    </select>
                  </div>

                  {/* Emoji buttons */}
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                    {["🎉", "🎁", "🎂", "❤️", "⭐", "🎊"].map((emoji) => (
                      <Button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="p-1 sm:p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors text-base sm:text-lg"
                        title={`Insert ${emoji}`}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  data-placeholder="What's this group all about? What occasions will you celebrate together?"
                  onInput={(e) => {
                    const text = e.currentTarget.innerText
                    setDescription(text)
                  }}
                  className="w-full px-4 py-3 min-h-[120px] focus:outline-none text-[#654321] bg-white text-xs sm:text-sm md:text-base"
                  style={{ whiteSpace: "pre-wrap" }}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#654321] mb-2">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-[#DAA520]" />
                Invite Members *
              </label>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                  placeholder="Enter member email address"
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border-2 border-[#DAA520]/30 rounded-lg focus:outline-none focus:border-[#DAA520] transition-colors text-[#654321] text-xs sm:text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={addEmail}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-semibold hover:shadow-lg transition-all text-xs sm:text-sm whitespace-nowrap"
                >
                  Add
                </button>
              </div>
              {memberEmails.length > 0 && (
                <div className="bg-[#F5F1E8] rounded-lg p-4 border-2 border-[#DAA520]/20">
                  <p className="text-xs sm:text-sm font-semibold text-[#654321] mb-2">
                    {memberEmails.length} member{memberEmails.length !== 1 ? "s" : ""} added:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {memberEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[#DAA520]/30 max-w-full"
                      >
                        <span className="text-[10px] sm:text-xs md:text-sm text-[#654321] truncate">{email}</span>
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] sm:text-sm text-[#8B4513]">Group Photo</label>
                <button
                  type="button"
                  onClick={handleGeneratePhoto}
                  disabled={isGeneratingName || !groupName.trim()}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white text-[9px] sm:text-xs font-semibold rounded-full border-2 border-amber-400/30 shadow-[0_4px_15px_rgba(251,146,60,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isGeneratingName ? "animate-spin" : ""}`} />
                  {isGeneratingName ? "Generating..." : "AI Generate Photo"}
                </button>
              </div>
              <div className="border-2 border-dashed border-[#8B4513]/30 rounded-lg p-6 text-center hover:border-[#8B4513]/50 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Group preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <label className="block mt-3 text-xs sm:text-sm text-[#8B4513]/70 hover:text-[#8B4513] cursor-pointer underline">
                      Upload a different photo
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <Upload className="w-12 h-12 mx-auto mb-3 text-[#8B4513]/40" />
                    <p className="text-xs sm:text-sm font-medium text-[#8B4513]/70 mb-1">Click to upload group photo</p>
                    <p className="text-[10px] sm:text-xs text-[#8B4513]/50">PNG, JPG or WEBP (max. 5MB)</p>
                    <p className="text-[10px] sm:text-xs text-[#8B4513]/50 mt-2">
                      Or use "Get AI Smart Suggestions" to auto-generate
                    </p>
                  </label>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-2 border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-[#654321]">
                  <p className="font-semibold mb-2 text-xs sm:text-sm">AI-Powered Group Management</p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleSmartMembers}
                      disabled={isSuggestingMembers}
                      className="flex items-center gap-2 text-[10px] sm:text-xs text-[#8B4513]/80 hover:text-amber-600 transition-colors w-full text-left group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">
                        • Smart member suggestions based on connections
                      </span>
                      {isSuggestingMembers && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleOccasionDetection}
                      className="flex items-center gap-2 text-[10px] sm:text-xs text-[#8B4513]/80 hover:text-amber-600 transition-colors w-full text-left group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">
                        • Automatic occasion detection for group members
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGroupInsights}
                      className="flex items-center gap-2 text-[10px] sm:text-xs text-[#8B4513]/80 hover:text-amber-600 transition-colors w-full text-left group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">
                        • AI-generated group insights and analytics
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleContributionPatterns}
                      className="flex items-center gap-2 text-[10px] sm:text-xs text-[#8B4513]/80 hover:text-amber-600 transition-colors w-full text-left group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">
                        • Predictive contribution patterns
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center items-center">
              <Link
                href="/groups"
                className="w-44 sm:w-48 px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-[#DAA520] text-[#654321] rounded-full font-bold text-center hover:bg-[#DAA520]/10 hover:scale-105 transition-all text-[10px] sm:text-xs md:text-sm"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-44 sm:w-48 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-full font-bold text-[10px] sm:text-xs md:text-sm hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#DAA520]/30"
                onClick={handleSubmit}
              >
                {isSubmitting ? "Creating Group..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
