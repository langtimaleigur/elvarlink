"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Container } from "@/components/ui/container"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Menu, Settings, User, X } from "lucide-react"
import { useState } from "react"

interface MainNavProps {
  user: {
    id: string
    email?: string
    profile?: {
      first_name?: string
      last_name?: string
      profile_image_url?: string
    }
  }
}

export function MainNav({ user }: MainNavProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Links", href: "/links" },
    { name: "Analytics", href: "/analytics" },
  ]

  const profileNavigation = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Domains", href: "/domains", icon: Settings },
  ]

  const initials = `${user.profile?.first_name?.[0] || ""}${
    user.profile?.last_name?.[0] || ""
  }`

  return (
    <header className="border-b border-gray-800 bg-black sticky top-0 z-50">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
              <span className="text-blue-500">Loopy</span>
              <span className="text-white">Link</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-8">
              {navigation.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className={
                    pathname === item.href
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }
                >
                  <Link href={item.href}>{item.name}</Link>
                </Button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-gray-900 border-gray-800 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-2 font-semibold text-xl mb-4">
                      <span className="text-blue-500">Loopy</span>
                      <span className="text-white">Link</span>
                    </div>
                    <nav className="flex flex-col space-y-1">
                      {navigation.map((item) => (
                        <Button
                          key={item.href}
                          variant="ghost"
                          asChild
                          className={
                            pathname === item.href
                              ? "justify-start text-white"
                              : "justify-start text-gray-400 hover:text-white"
                          }
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href={item.href}>{item.name}</Link>
                        </Button>
                      ))}
                    </nav>
                  </div>
                  <div className="p-4 mt-auto border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profile?.profile_image_url} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {user.profile?.first_name} {user.profile?.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <nav className="flex flex-col space-y-1">
                      {profileNavigation.map((item) => (
                        <Button
                          key={item.href}
                          variant="ghost"
                          asChild
                          className="justify-start text-gray-400 hover:text-white"
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href={item.href} className="flex items-center">
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.name}
                          </Link>
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        className="justify-start text-red-500 hover:text-red-400"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profile?.profile_image_url} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-gray-900 border-gray-800"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-white">
                      {user.profile?.first_name} {user.profile?.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
                {profileNavigation.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    className="text-white hover:bg-gray-800"
                    asChild
                  >
                    <Link href={item.href} className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem className="text-red-500 hover:bg-gray-800">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Container>
    </header>
  )
} 