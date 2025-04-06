// src/lib/actions/domains.ts

'use server'

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import dns from "dns/promises";

export async function addNewDomain(domain: string) {
  const supabase = createServerActionClient({ cookies });

  const user = await supabase.auth.getUser();
  const userId = user.data?.user?.id;
  if (!userId) throw new Error("User not authenticated");

  const verificationToken = `loopy-verification=${randomBytes(8).toString("hex")}`;

  const { data, error } = await supabase.from("domains").insert({
    domain,
    user_id: userId,
    verified: false,
    verified_at: null,
    verification_method: null,
    txt_record_value: verificationToken,
    is_primary: true,
    primary_domain_id: null,
  }).select().single();

  if (error) throw new Error(`Failed to insert domain: ${error.message}`);

  return data;
}

export async function verifyDomainTXT(domainId: string): Promise<{ success: boolean; reason?: string }> {
  const supabase = createServerActionClient({ cookies });

  const user = await supabase.auth.getUser();
  const userId = user.data?.user?.id;
  if (!userId) throw new Error("User not authenticated");

  const { data: domain, error: fetchError } = await supabase
    .from("domains")
    .select("domain, txt_record_value")
    .eq("id", domainId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !domain) throw new Error(`Failed to fetch domain: ${fetchError?.message || "Domain not found"}`);

  let records: string[][] = [];

  try {
    records = await dns.resolveTxt(domain.domain);
  } catch (err) {
    console.error("DNS TXT lookup failed:", err);
    return { success: false, reason: "DNS lookup failed" };
  }

  const flatRecords = records.flat().map((r) => r.trim());
  const isVerified = flatRecords.includes(domain.txt_record_value);

  if (isVerified) {
    const { error: updateError } = await supabase
      .from("domains")
      .update({
        verified: true,
        verification_method: "TXT",
        verified_at: new Date().toISOString(),
      })
      .eq("id", domainId);

    if (updateError) throw new Error(`Failed to update domain: ${updateError.message}`);
    return { success: true };
  }

  return { success: false, reason: "TXT value not found" };
}

export async function verifyDomainWellKnown(domainId: string): Promise<{ success: boolean; reason?: string }> {
  const supabase = createServerActionClient({ cookies });

  const user = await supabase.auth.getUser();
  const userId = user.data?.user?.id;
  if (!userId) throw new Error("User not authenticated");

  const { data: domain, error: fetchError } = await supabase
    .from("domains")
    .select("domain, txt_record_value")
    .eq("id", domainId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !domain) throw new Error(`Failed to fetch domain: ${fetchError?.message || "Domain not found"}`);

  try {
    const res = await fetch(`https://${domain.domain}/.well-known/loopy-verification.txt`);
    if (!res.ok) return { success: false, reason: "File not found or inaccessible" };

    const content = await res.text();
    const isVerified = content.trim() === domain.txt_record_value;

    if (isVerified) {
      const { error: updateError } = await supabase
        .from("domains")
        .update({
          verified: true,
          verification_method: "FILE",
          verified_at: new Date().toISOString(),
        })
        .eq("id", domainId);

      if (updateError) throw new Error(`Failed to update domain: ${updateError.message}`);
      return { success: true };
    }

    return { success: false, reason: "File content does not match" };
  } catch (err) {
    console.error("Well-known verification error:", err);
    return { success: false, reason: "Failed to access verification file" };
  }
}