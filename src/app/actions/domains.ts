'use server'

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"

export async function addNewDomain(domain: string) {
  const supabase = createServerActionClient({ cookies })

  const user = await supabase.auth.getUser()
  const userId = user.data?.user?.id
  if (!userId) throw new Error("User not authenticated")

  const verificationToken = `loopy-verification=${randomBytes(8).toString("hex")}`

  const { data, error } = await supabase.from("domains").insert({
    domain,
    user_id: userId,
    verified: false,
    is_primary: true,
    verification_method: null,
    txt_record_value: verificationToken,
  }).select().single()

  if (error) throw new Error(`Failed to insert domain: ${error.message}`)

  return data
} 