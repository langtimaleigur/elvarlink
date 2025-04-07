'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Globe, MoreVertical, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddDomainModal } from "./add-domain-modal"
import { CreateGroupModal } from "./create-group-modal"
import { DeleteDomainDialog } from "./delete-domain-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { verifyDomainTXT, verifyDomainWellKnown } from "@/lib/actions/domains"

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

type DomainGroup = {
  primary: Domain;
  groups: Domain[];
};

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [domainGroups, setDomainGroups] = useState<DomainGroup[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: domainsData, error: domainsError } = await supabase
      .from("domains")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (domainsError) {
      toast.error("Failed to fetch domains", {
        style: { background: '#1c1c1c', color: '#fff' }
      })
      return
    }

    setDomains(domainsData || [])

    // Group domains by primary_domain_id
    const groups: DomainGroup[] = []
    const primaryDomains = domainsData?.filter(d => d.is_primary) || []
    
    primaryDomains.forEach(primary => {
      const groupDomains = domainsData?.filter(d => 
        d.primary_domain_id === primary.id || 
        (d.is_primary && d.id === primary.id)
      ) || []
      
      groups.push({
        primary,
        groups: groupDomains
      })
    })

    setDomainGroups(groups)
  }

  const handleVerifyClick = async (domain: Domain) => {
    try {
      setVerifyingDomainId(domain.id)
      const result = await verifyDomainTXT(domain.id)
      if (result.success) {
        toast.success("Domain verified successfully!", {
          style: { background: '#1c1c1c', color: '#fff' }
        })
        fetchDomains()
      } else {
        toast.error(result.reason || "Verification failed. Please check your DNS settings and try again.", {
          style: { background: '#1c1c1c', color: '#fff' }
        })
      }
    } catch (error) {
      toast.error("Failed to verify domain", {
        style: { background: '#1c1c1c', color: '#fff' }
      })
    } finally {
      setVerifyingDomainId(null)
    }
  }

  const handleCreateGroup = (domain: Domain) => {
    if (!domain.is_primary) {
      toast.error("Groups can only be created under primary domains")
      return
    }
    setSelectedDomain(domain)
    setIsCreateGroupModalOpen(true)
  }

  const handleDeleteClick = (domain: Domain) => {
    setSelectedDomain(domain)
    setIsDeleteDialogOpen(true)
  }

  const getDomainType = (domain: Domain) => {
    if (domain.is_primary) return "Primary Domain"
    if (domain.primary_domain_id) return "Group"
    return "Domain"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Domains</h1>
          <p className="text-muted-foreground">
            Manage your custom domains and groups
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Domain
        </Button>
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No domains yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't added any domains yet. Start by connecting one now.
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Domain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {domainGroups.map((group) => (
            <div key={group.primary.id} className="space-y-2">
              <Card className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-semibold">
                          {group.primary.domain}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {getDomainType(group.primary)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Added {new Date(group.primary.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={group.primary.verified ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {group.primary.verified ? "Verified" : "Unverified"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {group.primary.verified && (
                            <DropdownMenuItem onClick={() => handleCreateGroup(group.primary)}>
                              Create Group
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(group.primary)}
                            className="text-destructive"
                          >
                            Delete Domain
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {!group.primary.verified && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="verification" className="border-0">
                        <Alert>
                          <AccordionTrigger className="w-full hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                              <AlertDescription>
                                <p className="text-sm">
                                  This domain needs to be verified before you can create links.
                                </p>
                              </AlertDescription>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  disabled={verifyingDomainId === group.primary.id}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleVerifyClick(group.primary)
                                  }}
                                >
                                  {verifyingDomainId === group.primary.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      Verifying
                                    </>
                                  ) : (
                                    'Verify'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <Tabs defaultValue="txt" className="w-full">
                              <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="txt">TXT Record</TabsTrigger>
                                <TabsTrigger value="file">File Upload</TabsTrigger>
                              </TabsList>
                              <TabsContent value="txt" className="space-y-4">
                                <div className="text-sm space-y-2">
                                  <p>1. Add a TXT record to your domain's DNS settings:</p>
                                  <div className="bg-card p-2 rounded-md">
                                    <div className="flex justify-between items-center gap-2">
                                      <code>_loopy</code>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          navigator.clipboard.writeText('_loopy')
                                          toast.success("Copied to clipboard", {
                                            style: { background: '#1c1c1c', color: '#fff' }
                                          })
                                        }}
                                      >
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm space-y-2">
                                  <p>2. Add this as the TXT value:</p>
                                  <div className="bg-card p-2 rounded-md">
                                    <div className="flex justify-between items-center gap-2">
                                      <code className="break-all">{group.primary.txt_record_value}</code>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 shrink-0"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          navigator.clipboard.writeText(group.primary.txt_record_value || '')
                                          toast.success("Copied to clipboard", {
                                            style: { background: '#1c1c1c', color: '#fff' }
                                          })
                                        }}
                                      >
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm space-y-1">
                                  <p>3. Click Verify once you've added the record</p>
                                  <p className="text-xs text-muted-foreground">DNS changes can take up to 24 hours to propagate</p>
                                </div>
                              </TabsContent>
                              <TabsContent value="file" className="space-y-4">
                                <div className="text-sm space-y-2">
                                  <p>1. Create this file on your domain:</p>
                                  <div className="bg-card p-2 rounded-md">
                                    <div className="flex justify-between items-center gap-2">
                                      <code>.well-known/loopy-verification.txt</code>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          navigator.clipboard.writeText('.well-known/loopy-verification.txt')
                                          toast.success("Copied to clipboard", {
                                            style: { background: '#1c1c1c', color: '#fff' }
                                          })
                                        }}
                                      >
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm space-y-2">
                                  <p>2. Add this as the file content:</p>
                                  <div className="bg-card p-2 rounded-md">
                                    <div className="flex justify-between items-center gap-2">
                                      <code className="break-all">{group.primary.txt_record_value}</code>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 shrink-0"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          navigator.clipboard.writeText(group.primary.txt_record_value || '')
                                          toast.success("Copied to clipboard", {
                                            style: { background: '#1c1c1c', color: '#fff' }
                                          })
                                        }}
                                      >
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm space-y-1">
                                  <p>3. Click Verify once you've created the file</p>
                                  <p className="text-xs text-muted-foreground">File must be accessible via HTTPS</p>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </AccordionContent>
                        </Alert>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardContent>
              </Card>

              {group.groups
                .filter(d => !d.is_primary)
                .map((domain) => (
                  <Card key={domain.id} className="overflow-hidden ml-6">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-semibold">
                              {domain.domain}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {getDomainType(domain)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Added {new Date(domain.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={domain.verified ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {domain.verified ? "Verified" : "Unverified"}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!domain.verified && (
                                <DropdownMenuItem onClick={() => handleVerifyClick(domain)}>
                                  Verify Domain
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(domain)}
                                className="text-destructive"
                              >
                                Delete Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          ))}
        </div>
      )}

      <AddDomainModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setSelectedDomain(null)
        }}
        domain={selectedDomain || undefined}
        isVerificationOnly={!!selectedDomain && !selectedDomain.verified}
      />

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => {
          setIsCreateGroupModalOpen(false)
          setSelectedDomain(null)
        }}
        primaryDomain={selectedDomain}
      />

      <DeleteDomainDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedDomain(null)
        }}
        domain={selectedDomain!}
        onSuccess={fetchDomains}
      />
    </div>
  )
} 