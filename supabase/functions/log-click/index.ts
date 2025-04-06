// supabase/functions/log-click/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

console.log("⚡ Loopy log-click function loaded!");

serve(async (req) => {
  const {
    link_id,
    ip_address,
    referrer,
    user_agent,
    country,
    city,
    device,
    browser,
    os,
    is_broken,
  } = await req.json();

  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const projectUrl = Deno.env.get("SUPABASE_URL");

  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const insertRes = await fetch(`${projectUrl}/rest/v1/clicks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      "apikey": serviceKey, // 👈 Add this linesupabase functions deploy log-click
      "Prefer": "return=representation", // ✅ This will give us more detail
    },
    body: JSON.stringify({
      link_id,
      ip_address,
      referrer,
      user_agent,
      country,
      city,
      device,
      browser,
      os,
      is_broken,
      timestamp: new Date().toISOString(),
    }),
  });

  const responseText = await insertRes.text();
  console.log("Insert response:", responseText);
  
  if (!insertRes.ok) {
    return new Response("Failed to log click", { status: 500 });
  }
  
  return new Response("Click logged", { status: 200 });
  return new Response("Click logged", { status: 200 });
});