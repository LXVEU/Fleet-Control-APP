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
  ArrowUpRight,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getCompanyId } from '../../lib/company'

type MileageLog = {
  id: string
  license_plate: string
  meter_value: number
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

type LogWithVehicle = MileageLog & {
  vehicle_name?: string
  vehicle_type?: string
  meter_type?: string
}

export default function MileagePage() {
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
        .from('mileage_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (logError) {
        console.error('Ошибка загрузки пробега:', logError)
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

  const getPreviousMeter = (log: LogWithVehicle, allLogs: LogWithVehicle[]) => {
    const vehicleLogs = allLogs
      .filter(l => l.license_plate === log.license_plate)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    
    const index = vehicleLogs.findIndex(l => l.id === log.id)
    if (index === -1 || index === vehicleLogs.length - 1) return null
    return vehicleLogs[index + 1]?.meter_value || null
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>Пробег</h1>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>
            {logs.length} записей пробега всего
          </p>
        </div>
        <button
          onClick={() => window.open('/mileage-add', '_blank')}
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
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Пред. пробег
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Текущий пробег
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Разница
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
                    <FileText size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                    <p>Нет записей пробега</p>
                    <p style={{ fontSize: 13, color: '#cbd5e1' }}>Добавьте первую запись</p>
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log, index) => {
                  const previousMeter = getPreviousMeter(log, logs)
                  const diff = previousMeter !== null 
                    ? log.meter_value - previousMeter 
                    : null
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
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                        {previousMeter !== null ? `${previousMeter.toLocaleString()} ${unit}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {log.meter_value.toLocaleString()} {unit}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {diff !== null ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 12px',
                            borderRadius: 12,
                            fontSize: 13,
                            fontWeight: 600,
                            color: diff > 0 ? '#059669' : diff < 0 ? '#dc2626' : '#94a3b8',
                            background: diff > 0 ? '#ecfdf5' : diff < 0 ? '#fef2f2' : '#f8fafc',
                          }}>
                            {diff > 0 ? '+' : ''}{diff.toLocaleString()} {unit}
                            {diff > 0 && <ArrowUpRight size={14} color="#059669" />}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>
                        )}
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
            Показано {sortedLogs.length} из {logs.length} записей
          </span>
          <button
            onClick={() => window.open('/mileage-add', '_blank')}
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