'use client'

import { useEffect, useState } from 'react'
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
    loadData()
  }, [])

  useEffect(() => {
    if (formData.vehicleId) {
      loadLastMileage()
    } else {
      setLastMileage(null)
    }
  }, [formData.vehicleId])

  async function loadData() {
    const companyId = await getCompanyId()

    if (!companyId) {
      setLoading(false)
      setError('Компания не найдена. Пожалуйста, войдите в систему.')
      return
    }

    try {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single()

      if (companyError) {
        console.error('Ошибка загрузки компании:', companyError)
      } else {
        setCompany(companyData)
      }

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
          setError('Нет зарегистрированной техники. Обратитесь к администратору.')
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
      const companyId = await getCompanyId()
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

      const companyId = await getCompanyId()
      if (!companyId) {
        throw new Error('Компания не найдена')
      }

      const selectedVehicle = vehicles.find(v => v.id === Number(formData.vehicleId))
      if (!selectedVehicle) {
        throw new Error('Выбранная техника не найдена')
      }

      // ─── ПРОВЕРКА: пробег не может быть меньше последнего ───
      if (lastMileage && meterValue < lastMileage.meter_value) {
        setError(`Ошибка! Новый пробег (${meterValue} ${getUnitLabel(selectedVehicle.meter_type)}) не может быть меньше предыдущего (${lastMileage.meter_value} ${getUnitLabel(selectedVehicle.meter_type)})`)
        setSubmitting(false)
        return
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
        {success ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 0',
            textAlign: 'center',
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle size={44} color="#22c55e" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 20, marginBottom: 8 }}>
              Спасибо, запись отправлена!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
              Данные успешно сохранены
            </p>
            <button
              onClick={() => {
                setSuccess(false)
                setFormData({ vehicleId: '', meterValue: '' })
                setLastMileage(null)
              }}
              style={{
                padding: '10px 40px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Добавить еще
            </button>
            
            {company && (
              <div style={{
                textAlign: 'center',
                marginTop: 24,
                fontSize: 12,
                color: '#94a3b8',
                fontWeight: 500,
              }}>
                {company.name}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Заголовок формы */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <Truck size={24} color="white" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, textAlign: 'center' }}>
                Добавить пробег
              </h1>
              <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
                Введите данные о пробеге техники
              </p>
            </div>

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
                {formData.vehicleId && (
                  <div style={{ 
                    fontSize: 12, 
                    color: '#94a3b8', 
                    marginTop: 4,
                  }}>
                    Единица измерения: <strong>{getUnitLabel(selectedVehicle?.meter_type)}</strong>
                    {lastMileage && (
                      <span style={{ marginLeft: 8, color: '#94a3b8' }}>
                        (последний: {lastMileage.meter_value.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
                {formData.vehicleId && lastMileage && (
                  <div style={{ 
                    fontSize: 12, 
                    color: '#94a3b8', 
                    marginTop: 2,
                  }}>
                    <span style={{ color: '#64748b' }}>
                      Пробег должен быть больше или равен {lastMileage.meter_value.toLocaleString()} {getUnitLabel(selectedVehicle?.meter_type)}
                    </span>
                  </div>
                )}
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

              {/* Название компании внизу */}
              {company && (
                <div style={{
                  textAlign: 'center',
                  marginTop: 16,
                  fontSize: 12,
                  color: '#94a3b8',
                  fontWeight: 500,
                }}>
                  {company.name}
                </div>
              )}
            </form>
          </>
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