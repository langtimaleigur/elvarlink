"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Container } from "@/components/ui/container"
import { CreateLinkModal } from "@/components/create-link-modal"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Menu, Settings, User, CreditCard, Plus, LayoutDashboard, Link as LinkIcon, LineChart, ArrowUpRight } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Domain } from "@/lib/supabase/schema"

interface MainNavProps {
  user: {
    id: string
    email?: string
    profile?: {
      first_name?: string
      last_name?: string
      profile_image_url?: string
      plan?: "free" | "pro" | "business"
    }
  }
  domains: Domain[]
}

export function MainNav({ user, domains = [] }: MainNavProps) {
  const pathname = usePathname()
  const [isNavOpen, setIsNavOpen] = useState(false)

  // Hide navbar on login page
  if (pathname === '/login') {
    return null
  }

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Links", href: "/links", icon: LinkIcon },
    { name: "Analytics", href: "/analytics", icon: LineChart },
  ]

  const userNavigation = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Domains", href: "/domains", icon: Settings },
    { name: "Billing", href: "/billing", icon: CreditCard },
  ]

  const initials = `${user.profile?.first_name?.[0] || ""}${
    user.profile?.last_name?.[0] || ""
  }`

  return (
    <header className="border-b border-gray-800 bg-black sticky top-0 z-50">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Mobile Navigation Drawer */}
          <Drawer open={isNavOpen} onOpenChange={setIsNavOpen}>
            <DrawerTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-fit max-h-[85vh]">
              <div className="px-5 py-4">
                {/* Main Navigation */}
                <nav className="flex flex-col space-y-1 mb-6">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        asChild
                        className={cn(
                          "justify-start w-full transition-colors",
                          isActive 
                            ? "bg-gray-800/50 text-white" 
                            : "text-gray-400 hover:text-white hover:bg-gray-800/30"
                        )}
                        onClick={() => setIsNavOpen(false)}
                      >
                        <Link href={item.href} className="flex items-center">
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Link>
                      </Button>
                    )
                  })}
                </nav>

                {/* Settings Navigation */}
                <div className="pt-6 border-t border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profile?.profile_image_url} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">
                          {user.profile?.first_name} {user.profile?.last_name}
                        </p>
                        <p className="text-sm text-gray-400">FREE</p>
                      </div>
                    </div>
                    {user.profile?.plan === "free" && (
                      <Button size="sm" className="gap-1">
                        Upgrade
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <nav className="flex flex-col space-y-1">
                    {userNavigation.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Button
                          key={item.href}
                          variant="ghost"
                          asChild
                          className={cn(
                            "justify-start w-full transition-colors",
                            isActive 
                              ? "bg-gray-800/50 text-white" 
                              : "text-gray-400 hover:text-white hover:bg-gray-800/30"
                          )}
                          onClick={() => setIsNavOpen(false)}
                        >
                          <Link href={item.href} className="flex items-center">
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </Link>
                        </Button>
                      )}
                    )}
                    <Button
                      variant="ghost"
                      className="justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10 w-full"
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Log out
                    </Button>
                  </nav>
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          {/* Logo - Centered on mobile */}
          <div className="flex-1 md:flex-none flex justify-center md:justify-start">
            <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
              <span className="text-blue-500">Loopy</span>
              <span className="text-white">Link</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className={cn(
                    "transition-colors",
                    isActive 
                      ? "bg-gray-800/50 text-white" 
                      : "text-gray-400 hover:text-white hover:bg-gray-800/30"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              )
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <CreateLinkModal domains={domains} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profile?.profile_image_url} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 p-3">
                  <div>
                    <p className="font-medium text-white">
                      {user.profile?.first_name} {user.profile?.last_name}
                    </p>
                    <p className="text-sm text-gray-400">FREE</p>
                  </div>
                  {user.profile?.plan === "free" && (
                    <Button size="sm" className="gap-1 ml-auto">
                      Upgrade
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-gray-800" />
                {userNavigation.map((item) => (
                  <DropdownMenuItem key={item.href} asChild className="text-gray-400 focus:bg-gray-800 focus:text-white">
                    <Link href={item.href} className="flex items-center w-full p-2">
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem className="text-red-500 focus:bg-red-500/10 focus:text-red-400 p-2">
                  <LogOut className="mr-3 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Add Link Button */}
          <div className="md:hidden">
            <CreateLinkModal domains={domains} />
          </div>
        </div>
      </Container>
    </header>
  )
} 