import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://pdkagrwixdcpyrweqvnr.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBka2FncndpeGRjcHlyd2Vxdm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwOTQwOTMsImV4cCI6MjA2MzY3MDA5M30.3vYifDXsClv1Iuf0N7wn31fDcqZ24qKv5sY3eksKVGk"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
})
