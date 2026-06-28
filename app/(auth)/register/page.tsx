// app/register/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Building2, ArrowRight, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Ошибка создания пользователя')

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName,
        })
        .select()
        .single()

      if (companyError) throw companyError

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          company_id: companyData.id,
          role: 'admin',
          full_name: formData.fullName,
        })

      if (profileError) throw profileError

      const defaultCategories = [
        'Двигатель',
        'Трансмиссия',
        'Ходовая часть',
        'Тормозная система',
        'Электрика',
        'Шины и диски',
        'Кузовные работы',
        'Плановое ТО',
      ]

      const categoriesData = defaultCategories.map(name => ({
        name,
        company_id: companyData.id,
      }))

      const { error: categoriesError } = await supabase
        .from('repair_categories')
        .insert(categoriesData)

      if (categoriesError) throw categoriesError

      setSuccess(true)
      
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Ошибка при регистрации. Попробуйте еще раз.')
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
        maxWidth: 460,
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
              Компания создана!
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
              Добро пожаловать в систему управления автопарком
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              Перенаправление на дашборд...
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
                <Building2 size={28} color="#005bff" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#0d1117' }}>
                Регистрация
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                Создайте компанию и начните работу
              </p>
            </div>

            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Название компании
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="ООО 'Автопарк'"
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

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Ваше имя
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Иван Иванов"
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

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Пароль
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <span style={{ color: '#6b7280', fontSize: 14 }}>
                Уже есть аккаунт?{' '}
                <a href="/login" style={{ color: '#005bff', textDecoration: 'none', fontWeight: 600 }}>
                  Войти
                </a>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}