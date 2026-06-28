// app/reset-password/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { KeyRound, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    // Проверяем, что пользователь пришел по ссылке сброса
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError('Ссылка недействительна. Попробуйте снова.')
      }
    })
  }, [])

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message || 'Ошибка при смене пароля')
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
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
        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle size={40} color="#22c55e" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0d1117' }}>
              Пароль изменён!
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
              Теперь вы можете войти с новым паролем
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              Перенаправление на страницу входа...
            </p>
          </div>
        ) : (
          <>
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
                <KeyRound size={28} color="#005bff" />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#0d1117' }}>
                Сброс пароля
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                Введите новый пароль
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

            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
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
                  minLength={6}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Подтвердите пароль
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? 'Сохранение...' : 'Установить пароль'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}