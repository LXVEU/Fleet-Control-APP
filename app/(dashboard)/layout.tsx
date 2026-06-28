'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Truck,
  Gauge,
  Wrench,
  Hammer,
  FileText,
  Settings,
  ChevronDown,
  User,
  Fuel,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getCompanyId } from '../lib/company'

type Company = {
  id: string
  name: string
}

type UserProfile = {
  full_name: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const menu = [
    { name: 'Панель управления', href: '/', icon: LayoutDashboard },
    { name: 'Техника', href: '/vehicles', icon: Truck },
    { name: 'Пробег', href: '/mileage', icon: Gauge },
    { name: 'ТО', href: '/maintenance', icon: Wrench },
    { name: 'Ремонты', href: '/repairs', icon: Hammer },
    { name: 'Документы', href: '/documents', icon: FileText },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // Загружаем данные компании и пользователя
  useEffect(() => {
    async function loadData() {
      const companyId = await getCompanyId()
      
      if (companyId) {
        // Загружаем компанию
        const { data: companyData } = await supabase
          .from('companies')
          .select('id, name')
          .eq('id', companyId)
          .single()
        
        setCompany(companyData)

        // Загружаем профиль пользователя
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()
          
          setUserProfile(profileData)
        }
      }
      setLoading(false)
    }
    
    loadData()
  }, [])

  // Определяем инициалы для аватарки
  const getInitials = () => {
    if (!userProfile?.full_name) return 'U'
    const names = userProfile.full_name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return names[0][0].toUpperCase()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* ─── ПРИГЛУШЕННЫЙ КРАСНО-ЖЕЛТЫЙ ГРАДИЕНТ ─── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background: '#f3f4f6',
          overflow: 'hidden',
        }}
      >
        {/* Желто-оранжевый градиент сверху слева */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 700,
            height: 700,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,196,80,0.30), transparent 70%)',
            filter: 'blur(80px)',
            animation: 'floatLeft 12s ease-in-out infinite alternate',
          }}
        />
        
        {/* Красно-оранжевый градиент снизу справа */}
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            right: -100,
            width: 650,
            height: 650,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,90,60,0.20), transparent 70%)',
            filter: 'blur(90px)',
            animation: 'floatRight 10s ease-in-out infinite alternate',
          }}
        />
        
        {/* Центральный теплый градиент */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,200,150,0.15), transparent 70%)',
            filter: 'blur(100px)',
            animation: 'floatCenter 15s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* ─── АНИМАЦИИ ─── */}
      <style>{`
        @keyframes floatLeft {
          0% {
            transform: translate(0, 0) scale(1);
          }
          100% {
            transform: translate(60px, 40px) scale(1.1);
          }
        }

        @keyframes floatRight {
          0% {
            transform: translate(0, 0) scale(1);
          }
          100% {
            transform: translate(-50px, -30px) scale(1.15);
          }
        }

        @keyframes floatCenter {
          0% {
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1.2);
          }
        }
      `}</style>

      {/* ─── САЙДБАР ─── */}
      <aside
        style={{
          width: 280,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.3)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          flexShrink: 0,
          zIndex: 10,
          boxShadow: '0 0 40px rgba(0,0,0,0.05)',
        }}
      >
        {/* Заголовок сайдбара - логотип + название компании */}
        <div
          style={{
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Иконка-логотип */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}
          >
            <Fuel size={20} />
          </div>

          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.3px',
              }}
            >
              {company?.name || 'Автопарк'}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: '#94a3b8',
                marginTop: 1,
                letterSpacing: '0.2px',
              }}
            >
              контроль автопарка
            </div>
          </div>
        </div>

        {/* Навигация */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '0 12px',
              marginBottom: 8,
            }}
          >
            МЕНЮ
          </div>

          {menu.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: active ? '#2563eb' : '#0f172a',
                  background: active ? 'rgba(37,99,235,0.10)' : 'transparent',
                  fontWeight: active ? 700 : 700,
                  fontSize: 14,
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <Icon
                  size={20}
                  style={{
                    color: active ? '#2563eb' : '#0f172a',
                    flexShrink: 0,
                  }}
                />
                <span>{item.name}</span>
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 12,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#2563eb',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Нижняя часть сайдбара - профиль пользователя */}
        <div
          style={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            paddingTop: 16,
            marginTop: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {loading ? '...' : getInitials()}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                {loading ? 'Загрузка...' : (userProfile?.full_name || 'Пользователь')}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                }}
              >
                {company?.name || 'Без компании'}
              </div>
            </div>
            <ChevronDown size={16} color="#94a3b8" />
          </div>
        </div>
      </aside>

      {/* ─── ОСНОВНОЙ КОНТЕНТ ─── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ flex: 1 }}>{children}</div>
      </main>

      {/* ─── МОБИЛЬНОЕ МЕНЮ ─── */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 40,
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 280,
              height: '100%',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              padding: 24,
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                <Fuel size={18} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {company?.name || 'Автопарк'}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: '#94a3b8',
                  }}
                >
                  контроль автопарка
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  marginLeft: 'auto',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {menu.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: active ? '#2563eb' : '#0f172a',
                      background: active ? 'rgba(37,99,235,0.10)' : 'transparent',
                      fontWeight: active ? 700 : 700,
                      fontSize: 14,
                    }}
                  >
                    <Icon
                      size={20}
                      style={{
                        color: active ? '#2563eb' : '#0f172a',
                        flexShrink: 0,
                      }}
                    />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Профиль в мобильном меню */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {loading ? '...' : getInitials()}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  {loading ? 'Загрузка...' : (userProfile?.full_name || 'Пользователь')}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#94a3b8',
                  }}
                >
                  {company?.name || 'Без компании'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}