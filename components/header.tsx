"use client"

import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { LoginModal } from "./login-modal"
import { SignUpModal } from "./signup-modal"
import { ChevronDown, User, Settings, LogOut, Gift, Users, Heart, BarChart3, Menu, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false)
  const { user, signOut } = useAuth()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { toast } = useToast()

  const handleLogin = () => {
    setIsLoginModalOpen(true)
  }

  const handleSignUp = () => {
    setIsSignUpModalOpen(true)
  }

  const handleLoginSuccess = () => {
    login()
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
        { title: "Browse Gifts", href: "/gifts/browse", description: "Discover gifts from affiliated stores" },
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
              className="flex items-center gap-1.5 sm:gap-2 md:gap-3 hover:opacity-100 transition-all duration-300 group flex-shrink-0"
              onClick={() => {
                toast({
                  title: "Going Home",
                  description: "Returning to homepage...",
                })
              }}
            >
              <div className="relative text-2xl sm:text-3xl md:text-4xl lg:text-5xl scale-x-[-1] hover:scale-x-[-1.1] hover:scale-y-110 transition-transform duration-300 group-hover:rotate-12 drop-shadow-[0_0_15px_rgba(218,165,32,0.6)] group-hover:drop-shadow-[0_0_25px_rgba(218,165,32,0.9)]">
                🐝
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[#F5DEB3] font-bold text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl leading-tight tracking-tight group-hover:opacity-90 transition-all duration-300">
                  Wishbee.ai
                </span>
                <span className="text-[#DAA520] text-[10px] sm:text-xs md:text-sm lg:text-base font-bold tracking-normal italic group-hover:tracking-wide transition-all duration-300 font-[family-name:var(--font-dancing)] text-center">
                  Gift Together
                </span>
              </div>
            </Link>

            {user ? (
              <>
                <div className="hidden lg:flex items-center gap-1">
                  {menuItems.map((item) => (
                    <div
                      key={item.title}
                      className="relative"
                      onMouseEnter={() => item.submenu && setOpenDropdown(item.title)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      {item.submenu ? (
                        <button className="flex items-center gap-1 px-4 py-2 text-[#F5DEB3] hover:text-[#DAA520] transition-colors duration-200 text-sm font-medium">
                          <item.icon className="w-4 h-4" />
                          {item.title}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMenuClick(item.href)}
                          className="flex items-center gap-2 w-52 px-4 py-3 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 text-sm font-medium text-left"
                        >
                          <item.icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{item.title}</div>
                            {item.title !== "Analytics" && <div className="text-xs opacity-70">{item.description}</div>}
                          </div>
                        </button>
                      )}

                      {item.submenu && openDropdown === item.title && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-[#F5DEB3] rounded-lg shadow-xl border-2 border-[#4A2F1A] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
                      )}
                    </div>
                  ))}

                  <div
                    className="relative ml-2"
                    onMouseEnter={() => setOpenDropdown("profile")}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-full hover:from-[#F4C430] hover:to-[#DAA520] transition-all duration-200 text-sm font-semibold shadow-md">
                      <User className="w-4 h-4" />
                      <span className="hidden xl:inline">My Account</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {openDropdown === "profile" && (
                      <div className="absolute top-full right-0 mt-1 w-52 bg-[#F5DEB3] rounded-lg shadow-xl border-2 border-[#4A2F1A] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-1.5 sm:p-2 text-[#F5DEB3] hover:text-[#DAA520] transition-colors"
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
          <div className="lg:hidden border-t-2 border-[#4A2F1A] bg-[#8B5A3C] animate-in slide-in-from-top duration-300">
            <div className="px-2 sm:px-3 py-3 sm:py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {menuItems.map((item) => (
                <div key={item.title}>
                  {item.submenu ? (
                    <>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === item.title ? null : item.title)}
                        className="flex items-center justify-between w-full px-3 sm:px-4 py-2 sm:py-3 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 text-left text-sm sm:text-base"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          {item.title}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
                            openDropdown === item.title ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {openDropdown === item.title && (
                        <div className="ml-4 sm:ml-6 mt-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                          {item.submenu.map((subitem) => (
                            <button
                              key={subitem.title}
                              onClick={() => handleMenuClick(subitem.href)}
                              className="block w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] transition-all duration-150"
                            >
                              <div className="text-[#F5DEB3] font-medium">{subitem.title}</div>
                              <div className="text-[#F5DEB3]/70 text-[10px] sm:text-xs mt-0.5">
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
                      className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-3 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 text-left text-sm sm:text-base"
                    >
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <div>
                        <div className="font-medium">{item.title}</div>
                        {item.title !== "Analytics" && (
                          <div className="text-[10px] sm:text-xs opacity-70">{item.description}</div>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              ))}

              <hr className="my-2 sm:my-3 border-[#4A2F1A]" />

              <button
                onClick={() => handleMenuClick("/profile")}
                className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-3 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 text-left text-sm sm:text-base"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <div>
                  <div className="font-medium">Profile</div>
                  <div className="text-[10px] sm:text-xs opacity-70">View your profile</div>
                </div>
              </button>
              <button
                onClick={() => handleMenuClick("/settings")}
                className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-3 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 text-left text-sm sm:text-base"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                <div>
                  <div className="font-medium">Settings</div>
                  <div className="text-[10px] sm:text-xs opacity-70">Manage preferences</div>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-3 text-[#F5DEB3] hover:bg-gradient-to-r hover:from-[#6B4423] hover:via-[#8B5A3C] hover:to-[#6B4423] hover:text-[#DAA520] rounded-lg transition-all duration-200 font-bold text-left text-sm sm:text-base"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <div>
                  <div className="font-medium">Logout</div>
                  <div className="text-[10px] sm:text-xs opacity-70">Sign out of account</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
