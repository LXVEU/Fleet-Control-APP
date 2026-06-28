// lib/company.ts
import { supabase } from './supabase'

export async function getCompanyId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  return data?.company_id || null
}

export async function getCompany() {
  const companyId = await getCompanyId()
  if (!companyId) return null

  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  return data
}