'use client'

import { useState, useTransition, useEffect } from 'react'
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
import { ArrowLeft, X, HelpCircle, Copy, Check, Globe, Loader2, Clock } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { addNewDomain, verifyDomainTXT, verifyDomainWellKnown } from '@/lib/actions/domains'
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

type Domain = {
  id: string;
  domain: string;
  verified: boolean;
  verification_method: "TXT" | "FILE" | null;
  txt_record_value: string | null;
}

type AddDomainModalProps = {
  isOpen: boolean
  onClose: () => void
  domain?: Domain
  verificationToken?: string
  isVerificationOnly?: boolean
}

export function AddDomainModal({ 
  isOpen, 
  onClose, 
  domain,
  verificationToken: initialVerificationToken,
  isVerificationOnly = false 
}: AddDomainModalProps) {
  const [step, setStep] = useState(isVerificationOnly ? 2 : 1)
  const [domainInput, setDomainInput] = useState(domain?.domain || '')
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [verificationToken, setVerificationToken] = useState<string | null>(initialVerificationToken || null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationMethod, setVerificationMethod] = useState<'txt' | 'file'>('txt')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [isButtonDisabled, setIsButtonDisabled] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Reset states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStatusMessage(null)
      setLastChecked(null)
      setIsButtonDisabled(false)
    }
  }, [isOpen])

  const handleNext = async () => {
    // Clean the domain input
    let cleanDomain = domainInput
      .replace(/^https?:\/\//, '') // Remove http:// or https://
      .replace(/^www\./, '') // Remove www.
      .trim()

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(cleanDomain)) {
      setError('Please enter a valid domain without http:// or www. (e.g., example.com)')
      return
    }

    // Check if domain contains invalid prefixes
    if (domainInput.includes('http://') || domainInput.includes('https://') || domainInput.includes('www.')) {
      setError('Please enter a raw domain without http:// or www. (e.g., example.com)')
      return
    }

    // Check if domain already exists
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('User not authenticated')
      return
    }

    const { data: existing } = await supabase
      .from("domains")
      .select("id")
      .eq("user_id", user.id)
      .ilike("domain", cleanDomain)

    if (existing && existing.length > 0) {
      setError('You\'ve already added this domain.')
      return
    }

    setError('')
    setStatusMessage(null)

    startTransition(async () => {
      try {
        const result = await addNewDomain(cleanDomain)
        setVerificationToken(result.txt_record_value)
        setStep(2)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error adding domain",
          description: error instanceof Error ? error.message : "Failed to add domain. Please try again.",
        })
      }
    })
  }

  const handleClose = () => {
    setStep(1)
    setDomainInput('')
    setError('')
    setVerificationToken(null)
    setStatusMessage(null)
    setLastChecked(null)
    setIsButtonDisabled(false)
    onClose()
  }

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const handleVerify = async () => {
    if (!domain?.id || isButtonDisabled) return;
    
    setIsVerifying(true);
    setLastChecked(new Date());
    
    try {
      const result = verificationMethod === 'txt' 
        ? await verifyDomainTXT(domain.id)
        : await verifyDomainWellKnown(domain.id);

      if (result.success) {
        setStatusMessage(null);
        toast({
          title: "Domain Verified",
          description: "Your domain has been successfully verified!",
        });
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setStatusMessage("Not yet verified. This can take up to 24h.");
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.reason || "We couldn't verify your domain. Please check your settings and try again.",
        });
        
        // Disable button for 3 seconds
        setIsButtonDisabled(true);
        setTimeout(() => {
          setIsButtonDisabled(false);
        }, 3000);
      }
    } catch (error) {
      setStatusMessage("An error occurred during verification. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred during verification",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTimeSinceLastCheck = () => {
    if (!lastChecked) return null;
    
    const seconds = Math.floor((new Date().getTime() - lastChecked.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? (
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span>Connect your custom domain</span>
              </div>
            ) : (
              'Verify Domain Ownership'
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6 py-4">
            <p className="text-sm text-muted-foreground">
              Start sharing branded links your audience will trust. You'll verify your domain in the next step.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <p className="text-sm text-muted-foreground">e.g. yourbrand.com</p>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="mt-2"
                  disabled={isPending}
                  aria-describedby="domain-description"
                />
                <p id="domain-description" className="sr-only">
                  Enter your domain name to start the verification process
                </p>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              To verify you own this domain, choose one of the following methods. Most users use the TXT method — it's fast and works everywhere.
            </p>

            {isVerifying ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Checking domain verification...</p>
                </div>
              </div>
            ) : (
              <>
                {statusMessage && (
                  <Alert variant="default" className="bg-muted">
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      {statusMessage}
                      {lastChecked && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Last checked {formatTimeSinceLastCheck()}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Tabs 
                  defaultValue="txt" 
                  className="w-full"
                  onValueChange={(value) => setVerificationMethod(value as 'txt' | 'file')}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="txt">TXT Record</TabsTrigger>
                    <TabsTrigger value="file">.well-known File</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="txt" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Name</Label>
                        <p className="text-sm text-muted-foreground">Verification name</p>
                      </div>
                      <div className="flex gap-2">
                        <Input value="_loopy" readOnly />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy('_loopy', 'name')}
                        >
                          {copiedField === 'name' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Value</Label>
                        <p className="text-sm text-muted-foreground">Copy this exact value to your DNS settings</p>
                      </div>
                      <div className="flex gap-2">
                        <Input value={verificationToken || ''} readOnly />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy(verificationToken || '', 'value')}
                        >
                          {copiedField === 'value' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="file" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>File Path</Label>
                        <p className="text-sm text-muted-foreground">Upload to the exact path so we can verify automatically</p>
                      </div>
                      <div className="flex gap-2">
                        <Input value=".well-known/loopy-verification.txt" readOnly />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy('.well-known/loopy-verification.txt', 'path')}
                        >
                          {copiedField === 'path' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>File Content</Label>
                        <p className="text-sm text-muted-foreground">Copy this exact content into the file</p>
                      </div>
                      <div className="flex gap-2">
                        <Input value={verificationToken || ''} readOnly />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy(verificationToken || '', 'content')}
                        >
                          {copiedField === 'content' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col gap-2">
          {step === 1 ? (
            <Button 
              onClick={handleNext} 
              className="ml-auto"
              disabled={isPending}
            >
              {isPending ? 'Adding...' : 'Next'}
            </Button>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2">
                {!isVerificationOnly && (
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button 
                  onClick={handleVerify}
                  disabled={isVerifying || isButtonDisabled}
                  className="flex-1"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
              {statusMessage && !isVerifying && (
                <p className="text-sm text-muted-foreground text-center">
                  {statusMessage}
                  {lastChecked && (
                    <span className="ml-1">
                      Last checked {formatTimeSinceLastCheck()}
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 