import { createClient } from '@supabase/supabase-js'

// Paste your values from Supabase → Project Settings → API
const supabaseUrl = 'https://bacgehhvpytkmwmelujq.supabase.co'
const supabaseAnonKey = 'sb_publishable_HL3bAb_GsaEo1EyntqWoYg_oOAIK_Qi'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
