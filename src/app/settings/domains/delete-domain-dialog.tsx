'use client'

import { useState } from 'react'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Domain = {
  id: string;
  domain: string;
  is_primary: boolean;
  primary_domain_id: string | null;
};

interface DeleteDomainDialogProps {
  isOpen: boolean;
  onClose: () => void;
  domain: Domain;
  onSuccess: () => void;
}

export function DeleteDomainDialog({ isOpen, onClose, domain, onSuccess }: DeleteDomainDialogProps) {
  const [confirmationText, setConfirmationText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClientComponentClient()

  const handleDelete = async () => {
    if (confirmationText !== "delete this domain") {
      toast.error("Please type the confirmation text exactly")
      return
    }

    setIsDeleting(true)

    try {
      // Check if domain has any links
      const { data: links, error: linksError } = await supabase
        .from("links")
        .select("id")
        .eq("domain_id", domain.id)
        .limit(1)

      if (linksError) throw linksError

      if (links && links.length > 0) {
        toast.error("Cannot delete domain with existing links")
        return
      }

      // Check if domain has any groups
      const { data: groups, error: groupsError } = await supabase
        .from("domains")
        .select("id")
        .eq("primary_domain_id", domain.id)
        .limit(1)

      if (groupsError) throw groupsError

      if (groups && groups.length > 0) {
        toast.error("Cannot delete domain with existing groups")
        return
      }

      // Delete the domain
      const { error: deleteError } = await supabase
        .from("domains")
        .delete()
        .eq("id", domain.id)

      if (deleteError) throw deleteError

      toast.success("Domain deleted successfully")
      onSuccess()
      onClose()
    } catch (err) {
      console.error("Error deleting domain:", err)
      toast.error("Failed to delete domain")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Domain</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please type "delete this domain" to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Confirmation</Label>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="delete this domain"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmationText !== "delete this domain"}
          >
            {isDeleting ? "Deleting..." : "Delete Domain"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 