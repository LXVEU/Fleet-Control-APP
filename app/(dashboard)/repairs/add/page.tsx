'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, Loader2, CheckCircle, AlertCircle, DollarSign, ArrowLeft } from 'lucide-react'
import { supabase } from '../../../../lib/supabase'
import { getCompanyId } from '../../../../lib/company'

type Vehicle = {
  id: number
  name: string
  license_plate: string
  meter_type?: string
  vehicle_type?: string
}

type RepairCategory = {
  id: string
  name: string
}

type Company = {
  id: string
  name: string
}

export default function RepairAddPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [categories, setCategories] = useState<RepairCategory[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    vehicleId: '',
    categoryId: '',
    description: '',
    cost: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const companyId = await getCompanyId()

    if (!companyId) {
      setLoading(false)
      setError('Компания не найдена. Пожалуйста, войдите в систему.')
      return
    }

    try {
      const [companyRes, vehRes, catRes] = await Promise.all([
        supabase.from('companies').select('id, name').eq('id', companyId).single(),
        supabase.from('vehicles').select('id, name, license_plate, meter_type, vehicle_type').eq('company_id', companyId).order('name'),
        supabase.from('repair_categories').select('id, name').eq('company_id', companyId).order('name'),
      ])

      if (companyRes.error) {
        console.error('Ошибка загрузки компании:', companyRes.error)
      } else {
        setCompany(companyRes.data)
      }

      if (vehRes.error) {
        console.error('Ошибка загрузки техники:', vehRes.error)
        setError('Ошибка загрузки списка техники')
      } else {
        setVehicles(vehRes.data || [])
        if (vehRes.data && vehRes.data.length === 0) {
          setError('Нет зарегистрированной техники. Обратитесь к администратору.')
        }
      }

      if (catRes.error) {
        console.error('Ошибка загрузки категорий:', catRes.error)
      } else {
        setCategories(catRes.data || [])
      }
    } catch (err) {
      console.error('Ошибка:', err)
      setError('Произошла ошибка при загрузке данных')
    } finally {
      setLoading(false)
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

      const cost = formData.cost ? Number(formData.cost) : 0
      if (cost < 0) {
        throw new Error('Стоимость не может быть отрицательной')
      }

      const companyId = await getCompanyId()
      if (!companyId) {
        throw new Error('Компания не найдена')
      }

      const selectedVehicle = vehicles.find(v => v.id === Number(formData.vehicleId))
      if (!selectedVehicle) {
        throw new Error('Выбранная техника не найдена')
      }

      if (!formData.categoryId) {
        throw new Error('Выберите категорию ремонта')
      }

      const { error: insertError } = await supabase
        .from('repair_logs')
        .insert({
          license_plate: selectedVehicle.license_plate,
          category_id: formData.categoryId,
          description: formData.description || null,
          cost: cost || null,
          company_id: companyId,
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Ошибка вставки:', insertError)
        throw new Error(`Ошибка сохранения: ${insertError.message}`)
      }

      setSuccess(true)
      setFormData({ vehicleId: '', categoryId: '', description: '', cost: '' })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при отправке')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '80vh',
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
      minHeight: '80vh',
      padding: '24px 90px',
      position: 'relative',
    }}>
      {/* Карточка формы */}
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: 40,
        maxWidth: 560,
        width: '100%',
        margin: '0 auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.3)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Кнопка назад */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 20,
            padding: '4px 0',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
        >
          <ArrowLeft size={18} />
          Назад к журналу ремонтов
        </button>

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
                setFormData({ vehicleId: '', categoryId: '', description: '', cost: '' })
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
                <Wrench size={24} color="white" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, textAlign: 'center' }}>
                Добавить ремонт
              </h1>
              <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
                Введите данные о ремонте
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
              <div style={{ marginBottom: 16 }}>
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
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.15s',
                    background: 'white',
                    color: '#0f172a',
                    cursor: 'pointer',
                    appearance: 'auto',
                    paddingRight: '40px',
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
                      {v.name} ({v.license_plate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Выбор категории */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#0f172a', 
                  marginBottom: 6 
                }}>
                  Категория ремонта <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.15s',
                    background: 'white',
                    color: '#0f172a',
                    cursor: 'pointer',
                    appearance: 'auto',
                    paddingRight: '40px',
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
                  <option value="">Выберите категорию</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Описание */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#0f172a', 
                  marginBottom: 6 
                }}>
                  Описание работ
                </label>
                <textarea
                  placeholder="Опишите выполненные работы"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.15s',
                    resize: 'vertical',
                    minHeight: '70px',
                    fontFamily: 'inherit',
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
              </div>

              {/* Стоимость */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#0f172a', 
                  marginBottom: 6 
                }}>
                  Стоимость (₽)
                </label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="number"
                    placeholder="Введите стоимость"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
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