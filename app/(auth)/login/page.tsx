// app/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Building2, LogIn, Mail, Lock } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  async function handleLogin(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  setError('')

  try {
    console.log('1. LOGIN START')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email.trim(),
      password: formData.password.trim(),
    })

    console.log('2. LOGIN RESPONSE')
    console.log('DATA:', data)
    console.log('ERROR:', error)

    if (error) {
      console.log('3. LOGIN ERROR BRANCH')
      setError(error.message)
      return
    }

    console.log('4. BEFORE ROUTER PUSH')
    router.push('/')
    console.log('5. AFTER ROUTER PUSH')
  } catch (err) {
    console.error('CRASH:', err)
    setError(String(err))
  } finally {
    setLoading(false)
  }
}

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: '#f0f2f5',
      position: 'relative',
    }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -130,
          left: -130,
          width: 700,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,210,60,0.32) 0%, rgba(255,160,40,0.18) 45%, transparent 75%)',
          filter: 'blur(72px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -160,
          right: -80,
          width: 600,
          height: 560,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,80,50,0.22) 0%, rgba(255,120,60,0.14) 45%, transparent 75%)',
          filter: 'blur(80px)',
        }} />
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px)',
        borderRadius: 32,
        padding: 40,
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: '#eef2ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <Building2 size={28} color="#005bff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#0d1117' }}>
            Добро пожаловать
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            Войдите в систему управления автопарком
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@company.ru"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  outline: 'none',
                  background: '#fff',
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Введите пароль"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  outline: 'none',
                  background: '#fff',
                }}
                required
              />
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: '#fff1f0',
              color: '#ff3b30',
              fontSize: 14,
              marginBottom: 16,
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: loading ? '#9ca3af' : '#005bff',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? 'Вход...' : 'Войти'}
            <LogIn size={18} />
          </button>
        </form>

        {/* Ссылка ЗА пределами формы */}
        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <Link 
            href="/forgot-password" 
            style={{ 
              color: '#6b7280', 
              fontSize: 13, 
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#005bff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            Забыли пароль?
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ color: '#6b7280', fontSize: 14 }}>
            Нет аккаунта?{' '}
            <a href="/register" style={{ color: '#005bff', textDecoration: 'none', fontWeight: 600 }}>
              Зарегистрировать компанию
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}