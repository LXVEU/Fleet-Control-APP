// components/LogoutButton.tsx
'use client'

import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        background: '#fff',
        color: '#6b7280',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#fff1f0'
        e.currentTarget.style.borderColor = '#ff3b30'
        e.currentTarget.style.color = '#ff3b30'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#fff'
        e.currentTarget.style.borderColor = '#e5e7eb'
        e.currentTarget.style.color = '#6b7280'
      }}
    >
      <LogOut size={16} />
      Выйти
    </button>
  )
}