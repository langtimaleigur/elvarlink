'use client'

import { useState } from 'react'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type Domain = {
  id: string;
  domain: string;
  verified: boolean;
  is_primary: boolean;
  primary_domain_id: string | null;
  verification_method: "TXT" | "FILE" | null;
  txt_record_value: string | null;
  created_at: string;
  verified_at: string | null;
};

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryDomain: Domain | null;
}

export function CreateGroupModal({ isOpen, onClose, primaryDomain }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!primaryDomain) {
      setError("No primary domain selected")
      return
    }

    if (!groupName) {
      setError("Please enter a group name")
      return
    }

    // Validate group name
    if (!/^[a-zA-Z0-9-]+$/.test(groupName)) {
      setError("Group name can only contain letters, numbers, and hyphens")
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const fullDomain = `${primaryDomain.domain}/${groupName}`

      const { error: insertError } = await supabase.from("domains").insert({
        domain: fullDomain,
        user_id: user.id,
        is_primary: false,
        primary_domain_id: primaryDomain.id,
        verified: true,
        verified_at: primaryDomain.verified_at,
        verification_method: primaryDomain.verification_method,
        txt_record_value: primaryDomain.txt_record_value,
      })

      if (insertError) throw insertError

      toast.success("Group created successfully")
      onClose()
    } catch (err) {
      console.error("Error creating group:", err)
      toast.error("Failed to create group")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!primaryDomain) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., go, blog, promo"
            />
            <p className="text-sm text-muted-foreground">
              Preview: {primaryDomain.domain}/{groupName || "group"}
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 