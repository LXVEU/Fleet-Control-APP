'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Truck, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getCompanyId } from '../lib/company'

type Vehicle = {
  id: number
  name: string
  license_plate: string
  meter_type?: string
  vehicle_type?: string
}

type Company = {
  id: string
  name: string
}

type LastMileage = {
  meter_value: number
  created_at: string
}

export default function MileageAddPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Получаем company_id из URL (если есть)
  const companyIdFromUrl = searchParams.get('company')
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastMileage, setLastMileage] = useState<LastMileage | null>(null)
  const [loadingLastMileage, setLoadingLastMileage] = useState(false)
  
  const [formData, setFormData] = useState({
    vehicleId: '',
    meterValue: '',
  })

  useEffect(() => {
    if (companyIdFromUrl) {
      // Если есть company в URL — используем её
      loadData(companyIdFromUrl)
    } else {
      // Если нет — пробуем получить из авторизации (для админов)
      loadDataFromAuth()
    }
  }, [companyIdFromUrl])

  useEffect(() => {
    if (formData.vehicleId) {
      loadLastMileage()
    } else {
      setLastMileage(null)
    }
  }, [formData.vehicleId])

  async function loadDataFromAuth() {
    const companyId = await getCompanyId()
    if (companyId) {
      loadData(companyId)
    } else {
      setLoading(false)
      setError('Компания не найдена. Пожалуйста, войдите в систему или используйте ссылку с параметром company.')
    }
  }

  async function loadData(companyId: string) {
    try {
      // Загружаем информацию о компании
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single()

      if (companyError) {
        console.error('Ошибка загрузки компании:', companyError)
        setError('Компания не найдена')
      } else {
        setCompany(companyData)
      }

      // Загружаем технику
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, name, license_plate, meter_type, vehicle_type')
        .eq('company_id', companyId)
        .order('name')

      if (error) {
        console.error('Ошибка загрузки техники:', error)
        setError('Ошибка загрузки списка техники')
      } else {
        setVehicles(data || [])
        if (data && data.length === 0) {
          setError('Нет зарегистрированной техники')
        }
      }
    } catch (err) {
      console.error('Ошибка:', err)
      setError('Произошла ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  async function loadLastMileage() {
    const selectedVehicle = vehicles.find(v => v.id === Number(formData.vehicleId))
    if (!selectedVehicle) return

    setLoadingLastMileage(true)
    try {
      const companyId = companyIdFromUrl || await getCompanyId()
      if (!companyId) return

      const { data, error } = await supabase
        .from('mileage_logs')
        .select('meter_value, created_at')
        .eq('license_plate', selectedVehicle.license_plate)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Ошибка загрузки последнего пробега:', error)
      } else {
        setLastMileage(data && data.length > 0 ? data[0] : null)
      }
    } catch (err) {
      console.error('Ошибка:', err)
    } finally {
      setLoadingLastMileage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (!formData.vehicleId) {
        throw new Error('Выберите технику из списка')
      }

      const meterValue = Number(formData.meterValue)
      if (isNaN(meterValue) || meterValue <= 0) {
        throw new Error('Введите корректное значение пробега (больше 0)')
      }

      const companyId = companyIdFromUrl || await getCompanyId()
      if (!companyId) {
        throw new Error('Компания не найдена')
      }

      const selectedVehicle = vehicles.find(v => v.id === Number(formData.vehicleId))
      if (!selectedVehicle) {
        throw new Error('Выбранная техника не найдена')
      }

      if (lastMileage && meterValue < lastMileage.meter_value) {
        if (!confirm(`Внимание! Новый пробег (${meterValue}) меньше предыдущего (${lastMileage.meter_value}). Продолжить?`)) {
          setSubmitting(false)
          return
        }
      }

      const { error: insertError } = await supabase
        .from('mileage_logs')
        .insert({
          license_plate: selectedVehicle.license_plate,
          meter_value: meterValue,
          company_id: companyId,
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Ошибка вставки:', insertError)
        throw new Error(`Ошибка сохранения: ${insertError.message}`)
      }

      setSuccess(true)
      setFormData({ vehicleId: '', meterValue: '' })
      setLastMileage(null)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при отправке')
    } finally {
      setSubmitting(false)
    }
  }

  const getUnitLabel = (meterType?: string) => {
    return meterType === 'hours' ? 'м/ч' : 'км'
  }

  const selectedVehicle = vehicles.find(v => v.id === Number(formData.vehicleId))

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#f1f5f9',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', padding: '20px 28px', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
          <span style={{ color: '#64748b', fontWeight: 500 }}>Загрузка данных...</span>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: '#f1f5f9',
      position: 'relative',
    }}>
      {/* Градиентный фон */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: '#f1f5f9',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,196,80,0.25), transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -150,
          right: -100,
          width: 650,
          height: 650,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,90,60,0.15), transparent 70%)',
          filter: 'blur(90px)',
        }} />
      </div>

      {/* Карточка формы */}
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: 40,
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.3)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Логотип */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
          }}>
            <Truck size={28} strokeWidth={2} />
          </div>
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Добавление пробега
            </div>
            {company && (
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginTop: 2 }}>
                {company.name}
              </div>
            )}
          </div>
        </div>

        {success ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 20px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle size={40} color="#22c55e" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 16 }}>
              Спасибо, запись отправлена!
            </h2>
            <p style={{ color: '#94a3b8', marginTop: 8, fontSize: 14 }}>
              Данные успешно сохранены
            </p>
            <button
              onClick={() => {
                setSuccess(false)
                setFormData({ vehicleId: '', meterValue: '' })
                setLastMileage(null)
              }}
              style={{
                marginTop: 20,
                padding: '10px 32px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Добавить еще
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                borderRadius: 12,
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#dc2626',
                fontSize: 14,
                marginBottom: 20,
              }}>
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Выбор техники */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                fontSize: 14, 
                fontWeight: 600, 
                color: '#0f172a', 
                marginBottom: 6 
              }}>
                Техника <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'all 0.15s',
                  background: 'white',
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <option value="">Выберите технику</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.license_plate}) — {getUnitLabel(v.meter_type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Последний пробег */}
            {formData.vehicleId && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  {loadingLastMileage ? 'Загрузка...' : 'Последний пробег'}
                </span>
                <span style={{ 
                  fontSize: 15, 
                  fontWeight: 700, 
                  color: lastMileage ? '#0f172a' : '#94a3b8' 
                }}>
                  {loadingLastMileage ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
                  ) : lastMileage ? (
                    `${lastMileage.meter_value.toLocaleString()} ${getUnitLabel(selectedVehicle?.meter_type)}`
                  ) : (
                    'Нет данных'
                  )}
                </span>
              </div>
            )}

            {/* Пробег */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: 'block', 
                fontSize: 14, 
                fontWeight: 600, 
                color: '#0f172a', 
                marginBottom: 6 
              }}>
                Пробег <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                placeholder="Введите значение пробега"
                value={formData.meterValue}
                onChange={(e) => setFormData({ ...formData, meterValue: e.target.value })}
                required
                min="0"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'all 0.15s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <div style={{ 
                fontSize: 12, 
                color: '#94a3b8', 
                marginTop: 4,
              }}>
                {formData.vehicleId ? (
                  <>
                    Единица измерения: <strong>{getUnitLabel(selectedVehicle?.meter_type)}</strong>
                    {lastMileage && (
                      <span style={{ marginLeft: 8, color: '#94a3b8' }}>
                        (последний: {lastMileage.meter_value.toLocaleString()})
                      </span>
                    )}
                  </>
                ) : (
                  'Выберите технику'
                )}
              </div>
            </div>

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: submitting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!submitting) e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Отправка...
                </>
              ) : (
                'Отправить'
              )}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}