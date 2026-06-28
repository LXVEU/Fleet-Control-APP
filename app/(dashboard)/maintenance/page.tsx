'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  FileText,
  Truck,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Wrench,
  DollarSign,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getCompanyId } from '../../lib/company'

type MaintenanceLog = {
  id: string
  license_plate: string
  meter_value: number
  service_description?: string
  cost?: number
  created_at: string
  company_id: string
}

type Vehicle = {
  id: number
  name: string
  license_plate: string
  vehicle_type: string
  meter_type?: string
}

type LogWithVehicle = MaintenanceLog & {
  vehicle_name?: string
  vehicle_type?: string
  meter_type?: string
}

export default function MaintenancePage() {
  const router = useRouter()
  const [logs, setLogs] = useState<LogWithVehicle[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const companyId = await getCompanyId()

    if (!companyId) {
      setLoading(false)
      return
    }

    try {
      const { data: vehData, error: vehError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('company_id', companyId)

      if (vehError) {
        console.error('Ошибка загрузки техники:', vehError)
      } else {
        setVehicles(vehData || [])
      }

      const { data: logData, error: logError } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (logError) {
        console.error('Ошибка загрузки ТО:', logError)
      } else {
        const logsWithVehicles = (logData || []).map(log => {
          const vehicle = (vehData || []).find(v => v.license_plate === log.license_plate)
          return {
            ...log,
            vehicle_name: vehicle?.name || log.license_plate,
            vehicle_type: vehicle?.vehicle_type || '-',
            meter_type: vehicle?.meter_type || 'km',
          }
        })
        setLogs(logsWithVehicles)
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const searchLower = search.toLowerCase()
    return (
      log.vehicle_name?.toLowerCase().includes(searchLower) ||
      log.license_plate?.toLowerCase().includes(searchLower)
    )
  })

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (sortField === 'created_at') {
      return sortDirection === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    
    if (sortField === 'name') {
      const aVal = a.vehicle_name || ''
      const bVal = b.vehicle_name || ''
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    if (sortField === 'meter_value') {
      return sortDirection === 'asc'
        ? (a.meter_value || 0) - (b.meter_value || 0)
        : (b.meter_value || 0) - (a.meter_value || 0)
    }
    
    if (sortField === 'cost') {
      return sortDirection === 'asc'
        ? (a.cost || 0) - (b.cost || 0)
        : (b.cost || 0) - (a.cost || 0)
    }
    
    return 0
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0)
  const totalLogs = logs.length

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
    <div style={{ padding: '24px 90px', position: 'relative' }}>
      {/* Заголовок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>ТО</h1>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>
            {totalLogs} записей ТО • Общая стоимость: ₽{totalCost.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => router.push('/maintenance/add')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={18} />
          Добавить запись
        </button>
      </div>

      {/* Поиск */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Поиск по названию или номеру..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 38px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
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

      {/* Таблица */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th 
                  style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('created_at')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Дата
                    {sortField === 'created_at' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('name')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Машина
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Госномер
                </th>
                <th 
                  style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('meter_value')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                    Пробег
                    {sortField === 'meter_value' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Описание
                </th>
                <th 
                  style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('cost')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                    Стоимость
                    {sortField === 'cost' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Тип
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                    <Wrench size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                    <p>Нет записей ТО</p>
                    <p style={{ fontSize: 13, color: '#cbd5e1' }}>Добавьте первую запись</p>
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log, index) => {
                  const unit = log.meter_type === 'hours' ? 'м/ч' : 'км'
                  const isHours = log.meter_type === 'hours'

                  return (
                    <tr 
                      key={log.id} 
                      style={{ 
                        borderBottom: index < sortedLogs.length - 1 ? '1px solid #f1f5f9' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {formatDate(log.created_at)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                        {log.vehicle_name || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontFamily: 'monospace', color: '#0f172a', letterSpacing: '0.5px' }}>
                        {log.license_plate || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {log.meter_value ? `${log.meter_value.toLocaleString()} ${unit}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.service_description || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#059669' }}>
                        {log.cost ? `₽${log.cost.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 12px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                          background: isHours ? '#fef3c7' : '#dbeafe',
                          color: isHours ? '#92400e' : '#1e40af',
                        }}>
                          {isHours ? 'Часы' : 'Км'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer таблицы */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fafbfc',
        }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            Показано {sortedLogs.length} из {totalLogs} записей • Общая стоимость: ₽{totalCost.toLocaleString()}
          </span>
          <button
            onClick={() => router.push('/maintenance/add')}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#2563eb',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={14} />
            Добавить запись
          </button>
        </div>
      </div>
    </div>
  )
}