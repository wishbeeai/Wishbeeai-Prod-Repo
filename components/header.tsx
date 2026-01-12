"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { LoginModal } from "./login-modal"
import { SignUpModal } from "./signup-modal"
import { ChevronDown, User, Settings, LogOut, Gift, Users, Heart, BarChart3, Menu, X, Shield, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false)
  const { user, signOut } = useAuth()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { toast } = useToast()
  
  const ADMIN_EMAIL = "wishbeeai@gmail.com"
  // Only show admin menu if user is logged in and email matches exactly (case-insensitive)
  const isAdmin = user?.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()

  const handleLogin = () => {
    setIsLoginModalOpen(true)
  }

  const handleSignUp = () => {
    setIsSignUpModalOpen(true)
  }

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false)
    toast({
      title: "Welcome back!",
      description: "You've successfully logged in.",
    })
  }

  const handleLogout = () => {
    signOut()
    setOpenDropdown(null)
    setIsMobileMenuOpen(false)
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    })
  }

  const handleMenuClick = (href?: string) => {
    if (href) {
      window.location.href = href
    }
    setIsMobileMenuOpen(false)
    setOpenDropdown(null)
  }

  const menuItems = [
    {
      title: "My Gifts",
      icon: Gift,
      submenu: [
        { title: "Active Gifts", href: "/gifts/active", description: "View and manage your ongoing gift collections" },
        { title: "Past Gifts", href: "/gifts/past", description: "Browse your completed gift history" },
        { title: "Create New Gift", href: "/gifts/create", description: "Start a new group gift collection" },
      ],
    },
    {
      title: "Groups",
      icon: Users,
      submenu: [
        { title: "My Groups", href: "/groups", description: "Manage your gifting groups" },
        { title: "Invitations", href: "/groups/invitations", description: "View pending group invitations" },
        { title: "Create Group", href: "/groups/create", description: "Form a new gifting group" },
      ],
    },
    {
      title: "Wishlists",
      icon: Heart,
      submenu: [
        { title: "My Wishlist", href: "/wishlist", description: "Manage your personal wishlist" },
        { title: "Friends' Wishlists", href: "/wishlist/friends", description: "Browse friends' wish items" },
        { title: "Add Wishlist", href: "/wishlist/add", description: "Add new items to your wishlist" },
      ],
    },
    // Admin-only menu item - only show if user is admin
    ...(isAdmin
      ? [
          {
            title: "Manage Affiliate Products",
            icon: Shield,
            href: "/admin/affiliate-products",
          },
        ]
      : []),
    {
      title: "Trending Gifts",
      icon: TrendingUp,
      href: "/gifts/trending",
      description: "Discover trending gifts from affiliated stores",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      href: "/analytics",
      description: "View your gifting statistics and insights",
    },
  ]

  return (
    <>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <SignUpModal isOpen={isSignUpModalOpen} onClose={() => setIsSignUpModalOpen(false)} />

      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] shadow-xl border-b-2 md:border-b-4 border-[#4A2F1A]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 lg:h-24 gap-2 sm:gap-4 md:gap-8">
            <Link
              href="/"
              className="flex items-center gap-0 hover:opacity-100 transition-all duration-300 group flex-shrink-0"
              onClick={() => {
                toast({
                  title: "Going Home",
                  description: "Returning to homepage...",
                })
              }}
            >
              <div className="relative h-14 w-auto sm:h-16 sm:w-auto md:h-20 md:w-auto lg:h-24 lg:w-auto xl:h-28 xl:w-auto flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/LogoBee-V1.png"
                  alt="Wishbee.ai Logo"
                  width={1024}
                  height={1024}
                  className="h-full w-auto object-contain transition-all duration-300"
                  priority
                />
              </div>
              <div className="flex flex-col gap-0.5 items-end -ml-3">
                <span className="text-[#F5DEB3] font-bold text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl leading-tight tracking-tight group-hover:text-[#DAA520] transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                  Wishbee.ai
                </span>
                <span className="text-[#F4C430] text-[10px] sm:text-xs md:text-sm lg:text-base font-bold tracking-normal italic group-hover:text-[#FFD700] group-hover:tracking-wide transition-all duration-300 font-[family-name:var(--font-shadows)] text-right drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                  Gift What They Love
                </span>
              </div>
            </Link>

            {user ? (
              <>
                <div className="hidden md:flex items-center justify-end gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 flex-1">
                  <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 flex-nowrap">
                    {menuItems.map((item) => (
                      <div
                        key={item.title}
                        className="relative flex-shrink-0"
                        onMouseEnter={() => item.submenu && setOpenDropdown(item.title)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        {item.submenu ? (
                          <button className="flex items-center gap-1 px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-2 text-[#F5DEB3] hover:text-[#DAA520] transition-colors duration-200 text-xs sm:text-sm font-medium whitespace-nowrap">
                            <item.icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">{item.title}</span>
                            <ChevronDown className="w-3 h-3 flex-shrink-0" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMenuClick(item.href)}
                            className="flex items-center gap-1 px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-2 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium whitespace-nowrap"
                          >
                            <item.icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="font-medium hidden sm:inline">{item.title}</span>
                          </button>
                        )}

                      {item.submenu && openDropdown === item.title && (
                        <div className="absolute top-full left-0 pt-2 w-64">
                          <div className="bg-[#F5DEB3] rounded-lg shadow-xl border-2 border-[#4A2F1A] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          {item.submenu.map((subitem) => (
                            <button
                              key={subitem.title}
                              onClick={() => handleMenuClick(subitem.href)}
                              className="block w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] transition-all duration-150 group"
                            >
                              <div className="font-medium text-[#8B5A3C] group-hover:text-[#F5DEB3]">
                                {subitem.title}
                              </div>
                              <div className="text-xs text-[#8B5A3C]/70 group-hover:text-[#F5DEB3]/80 mt-0.5">
                                {subitem.description}
                              </div>
                            </button>
                          ))}
                          </div>
                        </div>
                        )}
                      </div>
                    ))}
                    <div
                      className="relative ml-0.5 sm:ml-1 flex-shrink-0"
                      onMouseEnter={() => setOpenDropdown("profile")}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                    <button className="flex items-center gap-1 px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-full hover:from-[#F4C430] hover:to-[#DAA520] transition-all duration-200 text-xs sm:text-sm font-semibold shadow-md">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden lg:inline">My Account</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {openDropdown === "profile" && (
                      <div className="absolute top-full right-0 pt-2 w-52">
                        <div className="bg-[#F5DEB3] rounded-lg shadow-xl border-2 border-[#4A2F1A] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <button
                            onClick={() => {
                              handleMenuClick("/profile")
                              setOpenDropdown(null)
                            }}
                            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[#8B5A3C] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#F5DEB3] transition-all duration-150"
                          >
                            <User className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Profile</div>
                              <div className="text-xs opacity-70">View your profile</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              handleMenuClick("/settings")
                              setOpenDropdown(null)
                            }}
                            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[#8B5A3C] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#F5DEB3] transition-all duration-150"
                          >
                            <Settings className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Settings</div>
                              <div className="text-xs opacity-70">Manage preferences</div>
                            </div>
                          </button>
                          <hr className="my-2 border-[#4A2F1A]" />
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-[#8B5A3C] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#F5DEB3] transition-all duration-150 font-bold text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Logout</div>
                              <div className="text-xs opacity-70">Sign out of account</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-1.5 sm:p-2 text-[#F5DEB3] hover:text-[#DAA520] transition-colors flex items-center justify-center"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>
              </>
            ) : (
              <nav className="flex items-center gap-1.5 sm:gap-3 md:gap-4 flex-shrink-0">
                <button
                  onClick={handleLogin}
                  className="px-3 sm:px-4 md:px-6 lg:px-8 py-1 sm:py-1.5 md:py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] font-bold hover:from-[#F4C430] hover:to-[#DAA520] transition-all duration-300 rounded-full text-[10px] sm:text-xs md:text-sm shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-1 border-2 border-[#4A3018]/30 whitespace-nowrap"
                >
                  Log in
                </button>
                <button
                  onClick={handleSignUp}
                  className="px-3 sm:px-4 md:px-6 lg:px-8 py-1 sm:py-1.5 md:py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-full hover:shadow-lg hover:scale-105 hover:from-[#F4C430] hover:to-[#DAA520] transition-all duration-300 font-bold text-[10px] sm:text-xs md:text-sm shadow-md flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  Sign Up
                </button>
              </nav>
            )}
          </div>
        </div>

        {user && isMobileMenuOpen && (
          <div className="md:hidden border-t-2 border-[#4A2F1A] bg-[#8B5A3C] animate-in slide-in-from-top duration-300">
            <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {menuItems.map((item) => (
                <div key={item.title} className="w-full">
                  {item.submenu ? (
                    <>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === item.title ? null : item.title)}
                        className="flex items-center justify-between w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 text-left"
                      >
                        <span className="flex items-center gap-2 sm:gap-3 font-medium text-sm sm:text-base">
                          <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          {item.title}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform duration-200 ${
                            openDropdown === item.title ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {openDropdown === item.title && (
                        <div className="ml-6 sm:ml-8 mt-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                          {item.submenu.map((subitem) => (
                            <button
                              key={subitem.title}
                              onClick={() => handleMenuClick(subitem.href)}
                              className="block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] transition-all duration-150"
                            >
                              <div className="text-[#F5DEB3] font-medium text-sm sm:text-base">{subitem.title}</div>
                              <div className="text-[#F5DEB3]/70 text-xs sm:text-sm mt-1">
                                {subitem.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleMenuClick(item.href)}
                      className={`flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 text-left ${item.title === "Manage Affiliate Products" ? "whitespace-nowrap" : ""}`}
                    >
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <div className={`flex-1 ${item.title === "Manage Affiliate Products" ? "whitespace-nowrap" : ""}`}>
                        <div className="font-medium text-sm sm:text-base">{item.title}</div>
                        {item.title !== "Analytics" && item.title !== "Manage Affiliate Products" && item.title !== "Trending Gifts" && item.description && (
                          <div className="text-xs sm:text-sm opacity-70 mt-0.5">{item.description}</div>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              ))}

              <hr className="my-3 sm:my-4 border-[#4A2F1A]" />

              <button
                onClick={() => handleMenuClick("/profile")}
                className="flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 text-left"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm sm:text-base">Profile</div>
                  <div className="text-xs sm:text-sm opacity-70 mt-0.5">View your profile</div>
                </div>
              </button>
              <button
                onClick={() => handleMenuClick("/settings")}
                className="flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 text-left"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm sm:text-base">Settings</div>
                  <div className="text-xs sm:text-sm opacity-70 mt-0.5">Manage preferences</div>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 font-bold text-left"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm sm:text-base">Logout</div>
                  <div className="text-xs sm:text-sm opacity-70 mt-0.5">Sign out of account</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
