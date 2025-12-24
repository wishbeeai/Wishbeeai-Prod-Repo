import { createClient } from '@supabase/supabase-js'

// Create admin client with service role key
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Record payment transaction
export async function recordPaymentTransaction(data: {
  giftId: string
  contributorId?: string
  amount: number
  stripePaymentIntentId: string
  status: string
  contributorName?: string
  contributorEmail?: string
  message?: string
}) {
  const supabase = createAdminClient()
  
  const { data: contribution, error } = await supabase
    .from('contributions')
    .insert({
      gift_id: data.giftId,
      contributor_id: data.contributorId,
      amount: data.amount,
      stripe_payment_intent_id: data.stripePaymentIntentId,
      status: data.status,
      contributor_name: data.contributorName,
      contributor_email: data.contributorEmail,
      message: data.message,
    })
    .select()
    .single()
  
  if (error) throw error
  return contribution
}

// Update contribution status
export async function updateContributionStatus(
  stripePaymentIntentId: string,
  status: string
) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('contributions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', stripePaymentIntentId)
    .select()
    .single()
  
  if (error) throw error
  return data
}
