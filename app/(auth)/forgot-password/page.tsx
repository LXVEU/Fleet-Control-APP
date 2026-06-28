'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // ✅ БЕЗ redirectTo — Supabase сам перенаправит
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      setError(error.message || 'Ошибка при отправке ссылки')
    } else {
      setSuccess(true)
    }

    setLoading(false)
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
        <Link href="/login" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: '#6b7280',
          textDecoration: 'none',
          fontSize: 14,
          marginBottom: 24,
        }}>
          <ArrowLeft size={16} /> Назад
        </Link>

        {success ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle size={32} color="#22c55e" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#0d1117' }}>
              Ссылка отправлена!
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
              Проверьте почту и перейдите по ссылке для сброса пароля
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
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
                <Mail size={28} color="#005bff" />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#0d1117' }}>
                Восстановление пароля
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                Введите email, и мы отправим ссылку для сброса
              </p>
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

            <form onSubmit={handleResetRequest}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.ru"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                    outline: 'none',
                    background: '#fff',
                  }}
                  required
                />
              </div>

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
                }}
              >
                {loading ? 'Отправка...' : 'Отправить ссылку'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}