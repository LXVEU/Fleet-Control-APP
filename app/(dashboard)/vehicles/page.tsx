'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  X,
  ChevronRight,
  Wrench,
  FileText,
  Settings,
  ClipboardList,
  Truck,
  AlertCircle,
  Eye,
  Loader2,
  Calendar,
  DollarSign,
  Fuel,
  Gauge,
  CalendarDays,
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { getCompanyId } from '../../../lib/company'

// ───────────────── ТИПЫ ─────────────────
type Status = 'active' | 'warning' | 'critical'
type TabType = 'overview' | 'maintenance' | 'repairs' | 'documents'

type Vehicle = {
  id: number
  name: string
  license_plate: string
  vehicle_type: string
  meter_type?: string
  maintenance_interval: number
  company_id?: string
}

type MileageLog = {
  id?: string
  license_plate: string
  meter_value: number
  created_at: string
}

type MaintenanceLog = {
  id?: string
  license_plate: string
  meter_value: number
  created_at: string
  description?: string
  cost?: number
}

type RepairLog = {
  id?: string
  license_plate: string
  meter_value: number
  created_at: string
  description?: string
  cost?: number
  category_id?: string
}

type RepairCategory = {
  id: string
  name: string
  color?: string
}

type Document = {
  id?: string
  vehicle_id: number
  document_name: string
  start_date: string
  expiry_date?: string
  file_url?: string
  created_at: string
}

type VehicleDetail = {
  id: number
  name: string
  license_plate: string
  vehicle_type: string
  meter_type?: string
  maintenance_interval: number
  currentMeter: number
  lastService: number
  nextService: number
  status: Status
  unit: string
  remaining: number
  lastUpdate: string | null
  activities: Activity[]
  maintenanceHistory: MaintenanceLog[]
  repairHistory: RepairLog[]
  documents: Document[]
}

type Activity = {
  id?: string
  date: string
  description: string
  type: 'mileage' | 'maintenance' | 'repair'
}

// ───────────────── ФУНКЦИЯ ФОРМАТИРОВАНИЯ ─────────────────
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// ───────────────── ГЛАВНЫЙ КОМПОНЕНТ ─────────────────
export default function VehiclesPage() {
  const router = useRouter()
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [mileageLogs, setMileageLogs] = useState<MileageLog[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [repairLogs, setRepairLogs] = useState<RepairLog[]>([])
  const [repairCategories, setRepairCategories] = useState<RepairCategory[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDetail | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const companyId = await getCompanyId()

    if (!companyId) {
      setLoading(false)
      return
    }

    const [vehRes, mileRes, maintRes, repairRes, categoryRes, docRes] = await Promise.all([
      supabase.from('vehicles').select('*').eq('company_id', companyId),
      supabase.from('mileage_logs').select('*').eq('company_id', companyId),
      supabase.from('maintenance_logs').select('*').eq('company_id', companyId),
      supabase.from('repair_logs').select('*').eq('company_id', companyId),
      supabase.from('repair_categories').select('*').eq('company_id', companyId),
      supabase.from('documents').select('*').eq('company_id', companyId),
    ])

    setVehicles(vehRes.data || [])
    setMileageLogs(mileRes.data || [])
    setMaintenanceLogs(maintRes.data || [])
    setRepairLogs(repairRes.data || [])
    setRepairCategories(categoryRes.data || [])
    setDocuments(docRes.data || [])
    setLoading(false)
  }

  const getCurrentMeter = (v: Vehicle) => {
    const logs = mileageLogs
      .filter(l => l.license_plate === v.license_plate)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    return Number(logs[0]?.meter_value ?? 0)
  }

  const getLastUpdate = (v: Vehicle) => {
    const logs = mileageLogs
      .filter(l => l.license_plate === v.license_plate)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    return logs[0]?.created_at || null
  }

  const getLastTO = (v: Vehicle) => {
    const logs = maintenanceLogs
      .filter(l => l.license_plate === v.license_plate)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    return Number(logs[0]?.meter_value ?? 0)
  }

  const getTOStatus = (v: Vehicle) => {
    const current = getCurrentMeter(v)
    const interval = Number(v.maintenance_interval || 10000)
    const lastTO = getLastTO(v)

    const nextTO = lastTO + interval
    const remaining = nextTO - current

    const status: Status = remaining <= 0 ? 'critical' : remaining <= interval * 0.2 ? 'warning' : 'active'

    return {
      nextTO,
      remaining,
      status,
      critical: remaining <= 0,
      soon: remaining > 0 && remaining <= interval * 0.2,
    }
  }

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '-'
    const category = repairCategories.find(c => c.id === categoryId)
    return category?.name || '-'
  }

  const getDocumentStatus = (expiryDate?: string) => {
    if (!expiryDate) return { label: 'Без срока', color: '#94a3b8', bg: '#f1f5f9', icon: null }
    
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { 
        label: 'Истек', 
        color: '#dc2626', 
        bg: '#fef2f2',
        icon: <XCircle size={14} color="#dc2626" />
      }
    } else if (diffDays <= 30) {
      return { 
        label: `Скоро истечет (${diffDays} дн.)`, 
        color: '#d97706', 
        bg: '#fffbeb',
        icon: <AlertTriangle size={14} color="#d97706" />
      }
    } else {
      return { 
        label: 'Норма', 
        color: '#059669', 
        bg: '#ecfdf5',
        icon: <CheckCircle size={14} color="#059669" />
      }
    }
  }

  const getVehicleDetails = (v: Vehicle): VehicleDetail => {
    const to = getTOStatus(v)
    const unit = v.meter_type === 'hours' ? 'м/ч' : 'км'
    
    const vehicleMileageLogs = mileageLogs
      .filter(l => l.license_plate === v.license_plate)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    
    const vehicleMaintenanceLogs = maintenanceLogs
      .filter(l => l.license_plate === v.license_plate)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

    const vehicleRepairLogs = repairLogs
      .filter(l => l.license_plate === v.license_plate)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

    const vehicleDocuments = documents
      .filter(d => d.vehicle_id === v.id)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

    const mileageActivities: Activity[] = vehicleMileageLogs.map(log => ({
      date: log.created_at,
      description: `${formatNumber(log.meter_value)} ${unit}`,
      type: 'mileage' as const
    }))

    return {
      id: v.id,
      name: v.name,
      license_plate: v.license_plate,
      vehicle_type: v.vehicle_type,
      meter_type: v.meter_type,
      maintenance_interval: v.maintenance_interval,
      currentMeter: getCurrentMeter(v),
      lastService: getLastTO(v),
      nextService: to.nextTO,
      status: to.status,
      unit: unit,
      remaining: to.remaining,
      lastUpdate: getLastUpdate(v),
      activities: mileageActivities,
      maintenanceHistory: vehicleMaintenanceLogs,
      repairHistory: vehicleRepairLogs,
      documents: vehicleDocuments,
    }
  }

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.license_plate.toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false
      if (filter === 'critical') return getTOStatus(v).critical
      if (filter === 'soon') return getTOStatus(v).soon
      return true
    })
  }, [vehicles, search, filter])

  const stats = useMemo(() => {
    const total = filtered.length
    const active = filtered.filter(v => getTOStatus(v).status === 'active').length
    const warning = filtered.filter(v => getTOStatus(v).status === 'warning').length
    const critical = filtered.filter(v => getTOStatus(v).status === 'critical').length
    
    return { total, active, warning, critical }
  }, [filtered])

  const handleVehicleClick = (v: Vehicle) => {
    const details = getVehicleDetails(v)
    setSelectedVehicle(details)
    setShowModal(true)
    setActiveTab('overview')
  }

  // ─── КАРТОЧКА ТЕХНИКИ ───
  function VehicleCard({ v }: { v: Vehicle }) {
    const current = getCurrentMeter(v)
    const to = getTOStatus(v)
    const unit = v.meter_type === 'hours' ? 'м/ч' : 'км'
    
    const toCount = maintenanceLogs.filter(l => l.license_plate === v.license_plate).length
    const repairCount = repairLogs.filter(l => l.license_plate === v.license_plate).length
    const docCount = documents.filter(d => d.vehicle_id === v.id).length
    
    const statusConfig = {
      active: { 
        label: 'Норма', 
        color: '#059669', 
        bg: '#ecfdf5',
        border: '#a7f3d0',
      },
      warning: { 
        label: 'Скоро ТО', 
        color: '#d97706', 
        bg: '#fffbeb',
        border: '#fcd34d',
      },
      critical: { 
        label: 'Срочно', 
        color: '#dc2626', 
        bg: '#fef2f2',
        border: '#fca5a5',
      },
    }[to.status]

    const pct = Math.min(((current - getLastTO(v)) / (v.maintenance_interval || 10000)) * 100, 100)

    return (
      <div
        onClick={() => handleVehicleClick(v)}
        style={{
          background: 'white',
          borderRadius: 20,
          padding: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)'
          e.currentTarget.style.borderColor = '#93c5fd'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
          e.currentTarget.style.borderColor = '#f1f5f9'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{v.name}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{v.vehicle_type}</div>
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end',
            gap: 4
          }}>
            <div style={{
              background: statusConfig.bg,
              color: statusConfig.color,
              border: `1px solid ${statusConfig.border}`,
              padding: '4px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}>
              {statusConfig.label}
            </div>
            <div style={{ 
              fontSize: 12, 
              fontFamily: 'monospace', 
              color: '#94a3b8', 
              background: '#f8fafc',
              padding: '2px 10px',
              borderRadius: 6,
              letterSpacing: '0.5px'
            }}>
              {v.license_plate}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 16,
        }}>
          <div style={{
            background: '#f8fafc',
            padding: '10px 12px',
            borderRadius: 12,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Пробег
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
              {formatNumber(current)}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{unit}</div>
          </div>
          <div style={{
            background: '#f8fafc',
            padding: '10px 12px',
            borderRadius: 12,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Послед ТО
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
              {formatNumber(getLastTO(v))}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{unit}</div>
          </div>
          <div style={{
            background: '#f8fafc',
            padding: '10px 12px',
            borderRadius: 12,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              След ТО
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
              {formatNumber(to.nextTO)}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{unit}</div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
            <span style={{ fontWeight: 500 }}>Прогресс до ТО</span>
            <span style={{ fontWeight: 600, color: to.critical ? '#dc2626' : to.soon ? '#d97706' : '#059669' }}>
              {to.remaining > 0 ? `${formatNumber(to.remaining)} ${unit}` : 'Срочно ТО'}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: 6,
            background: '#f1f5f9',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(pct, 100)}%`,
              height: '100%',
              background: to.critical ? '#ef4444' : to.soon ? '#f59e0b' : '#22c55e',
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarDays size={14} color="#94a3b8" />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                ТО: <span style={{ fontWeight: 600, color: '#0f172a' }}>{toCount}</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Wrench size={14} color="#94a3b8" />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Рем: <span style={{ fontWeight: 600, color: '#0f172a' }}>{repairCount}</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FileText size={14} color="#94a3b8" />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Док: <span style={{ fontWeight: 600, color: '#0f172a' }}>{docCount}</span>
              </span>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: '#2563eb',
            fontSize: 13,
            fontWeight: 600,
          }}>
            <span>Детали</span>
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    )
  }

  // ─── МОДАЛЬНОЕ ОКНО ───
  function VehicleModal({ 
    v, 
    onClose 
  }: { 
    v: VehicleDetail
    onClose: () => void 
  }) {
    const statusConfig = {
      active: { label: 'Норма', color: '#059669', bg: '#ecfdf5', dot: '#059669' },
      warning: { label: 'Скоро ТО', color: '#d97706', bg: '#fffbeb', dot: '#d97706' },
      critical: { label: 'Срочно', color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
    }[v.status]

    const getRemainingColor = () => {
      if (v.remaining <= 0) return { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', label: '0 ' + v.unit }
      if (v.remaining <= v.maintenance_interval * 0.2) return { bg: '#fffbeb', border: '#fcd34d', text: '#d97706', label: formatNumber(v.remaining) + ' ' + v.unit }
      return { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669', label: formatNumber(v.remaining) + ' ' + v.unit }
    }

    const remainingColor = getRemainingColor()

    useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }, [onClose])

    const tabs = [
      { id: 'overview', label: 'Журнал пробега', icon: ClipboardList },
      { id: 'maintenance', label: 'ТО', icon: Settings },
      { id: 'repairs', label: 'Ремонты', icon: Wrench },
      { id: 'documents', label: 'Документы', icon: FileText },
    ]

    return (
      <>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 999,
          }}
          onClick={onClose}
        />
        
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'white',
              width: '100%',
              maxWidth: '900px',
              borderRadius: 32,
              boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ─── ЗАГОЛОВОК ─── */}
            <div style={{
              padding: '12px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: '56px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  <Truck size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                    {v.name}
                  </h2>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.2 }}>{v.vehicle_type}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  padding: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 8,
                  transition: 'background 0.15s',
                  color: '#94a3b8',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            {/* ─── ТЕЛО ─── */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* ЛЕВАЯ ПАНЕЛЬ - СТАТИСТИКА */}
              <div style={{
                width: 280,
                padding: '16px 20px',
                background: '#fafbfc',
                borderRight: '1px solid #f1f5f9',
                overflowY: 'auto',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}>
                {/* Госномер */}
                <div style={{
                  background: 'white',
                  padding: '6px 16px',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#0f172a',
                  letterSpacing: '1px',
                  width: '100%',
                  textAlign: 'center',
                }}>
                  {v.license_plate}
                </div>

                {/* Статус */}
                <div style={{
                  background: statusConfig.bg,
                  color: statusConfig.color,
                  border: `1px solid ${statusConfig.dot}40`,
                  padding: '4px 16px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600,
                  width: '100%',
                  textAlign: 'center',
                }}>
                  {statusConfig.label}
                </div>

                {/* Текущий пробег */}
                <div style={{
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  padding: '12px 16px',
                  borderRadius: 16,
                  textAlign: 'center',
                  width: '100%',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Текущий пробег
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: 'white', marginTop: 2 }}>
                    {formatNumber(v.currentMeter)}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{v.unit}</div>
                </div>

                {/* Последнее ТО */}
                <div style={{
                  background: 'white',
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Последнее ТО
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {formatNumber(v.lastService)} {v.unit}
                    </div>
                  </div>
                  <Calendar size={16} color="#94a3b8" />
                </div>

                {/* Следующее ТО */}
                <div style={{
                  background: 'white',
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Следующее ТО
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {formatNumber(v.nextService)} {v.unit}
                    </div>
                  </div>
                  <CalendarDays size={16} color="#94a3b8" />
                </div>

                {/* Осталось */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: `1px solid ${remainingColor.border}`,
                  background: remainingColor.bg,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: remainingColor.text, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Осталось
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {remainingColor.label}
                    </div>
                  </div>
                  <Clock size={16} color={remainingColor.text} />
                </div>

                {/* Сводка */}
                <div style={{ width: '100%', marginTop: 'auto' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, textAlign: 'center' }}>
                    Сводка
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                  }}>
                    <div style={{ background: 'white', padding: '8px 10px', borderRadius: 12, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>ТО</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{v.maintenanceHistory.length}</div>
                    </div>
                    <div style={{ background: 'white', padding: '8px 10px', borderRadius: 12, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Ремонты</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{v.repairHistory.length}</div>
                    </div>
                    <div style={{ background: 'white', padding: '8px 10px', borderRadius: 12, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>Стоимость ТО</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                        ₽{formatNumber(v.maintenanceHistory.reduce((sum, m) => sum + (m.cost || 0), 0))}
                      </div>
                    </div>
                    <div style={{ background: 'white', padding: '8px 10px', borderRadius: 12, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>Стоимость рем.</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>
                        ₽{formatNumber(v.repairHistory.reduce((sum, r) => sum + (r.cost || 0), 0))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ПРАВАЯ ПАНЕЛЬ - ВКЛАДКИ */}
              <div style={{
                flex: 1,
                padding: '20px 24px',
                overflowY: 'auto',
              }}>
                <div style={{
                  display: 'flex',
                  gap: 20,
                  borderBottom: '1px solid #f1f5f9',
                  marginBottom: 16,
                }}>
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        style={{
                          paddingBottom: 10,
                          fontSize: 12,
                          fontWeight: 600,
                          color: activeTab === tab.id ? '#2563eb' : '#94a3b8',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Icon size={15} />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                {/* ─── ЖУРНАЛ ПРОБЕГА (ТАБЛИЦА) ─── */}
                {activeTab === 'overview' && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10, textAlign: 'center' }}>
                      Журнал пробега
                    </h3>
                    {v.activities.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Дата</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Пробег</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Изменение</th>
                            </tr>
                          </thead>
                          <tbody>
                            {v.activities.map((activity, index) => {
                              let change = null
                              if (index < v.activities.length - 1) {
                                const currentValue = parseFloat(activity.description.replace(/[^\d]/g, ''))
                                const nextValue = parseFloat(v.activities[index + 1].description.replace(/[^\d]/g, ''))
                                if (!isNaN(currentValue) && !isNaN(nextValue)) {
                                  change = currentValue - nextValue
                                }
                              }
                              return (
                                <tr key={index} style={{ borderBottom: '1px solid #f8fafc' }}>
                                  <td style={{ textAlign: 'center', padding: '6px 10px', color: '#0f172a', fontSize: 12 }}>
                                    {new Date(activity.date).toLocaleDateString('ru-RU')}
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '6px 10px', color: '#0f172a', fontSize: 12, fontWeight: 600 }}>
                                    {activity.description}
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '6px 10px', fontSize: 12 }}>
                                    {change !== null ? (
                                      <span style={{
                                        color: change > 0 ? '#059669' : change < 0 ? '#dc2626' : '#94a3b8',
                                        fontWeight: 600,
                                      }}>
                                        {change > 0 ? '+' : ''}{change.toLocaleString()} {v.unit}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                        <p>Нет записей пробега</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── ТО ─── */}
                {activeTab === 'maintenance' && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10, textAlign: 'center' }}>
                      История ТО
                    </h3>
                    {v.maintenanceHistory.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Дата</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Пробег</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Описание</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Стоимость</th>
                            </tr>
                          </thead>
                          <tbody>
                            {v.maintenanceHistory.map((record, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #f8fafc' }}>
                                <td style={{ textAlign: 'center', padding: '6px 10px', color: '#0f172a', fontSize: 12 }}>
                                  {new Date(record.created_at).toLocaleDateString('ru-RU')}
                                </td>
                                <td style={{ textAlign: 'center', padding: '6px 10px', color: '#0f172a', fontSize: 12 }}>
                                  {formatNumber(record.meter_value)} {v.unit}
                                </td>
                                <td style={{ textAlign: 'center', padding: '6px 10px', color: '#64748b', fontSize: 12 }}>
                                  {record.description || '-'}
                                </td>
                                <td style={{ textAlign: 'center', padding: '6px 10px', color: '#0f172a', fontWeight: 600, fontSize: 12 }}>
                                  ₽{formatNumber(record.cost || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: '#f8fafc' }}>
                              <td colSpan={3} style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 600, color: '#0f172a', fontSize: 12 }}>
                                Общая стоимость
                              </td>
                              <td style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 700, color: '#059669', fontSize: 12 }}>
                                ₽{formatNumber(v.maintenanceHistory.reduce((sum, m) => sum + (m.cost || 0), 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                        <p>Нет записей о ТО</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── РЕМОНТЫ ─── */}
                {activeTab === 'repairs' && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10, textAlign: 'center' }}>
                      История ремонтов
                    </h3>
                    {v.repairHistory.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Дата</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Категория</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Описание</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Стоимость</th>
                            </tr>
                          </thead>
                          <tbody>
                            {v.repairHistory.map((record, index) => {
                              const categoryName = getCategoryName(record.category_id)
                              return (
                                <tr key={index} style={{ borderBottom: '1px solid #f8fafc' }}>
                                  <td style={{ textAlign: 'center', padding: '6px 10px', color: '#0f172a', fontSize: 12 }}>
                                    {new Date(record.created_at).toLocaleDateString('ru-RU')}
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '6px 10px', color: '#0f172a', fontSize: 12 }}>
                                    <span style={{
                                      background: '#f1f5f9',
                                      padding: '2px 10px',
                                      borderRadius: 12,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: '#475569',
                                      display: 'inline-block',
                                    }}>
                                      {categoryName}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '6px 10px', color: '#64748b', fontSize: 12 }}>
                                    {record.description || '-'}
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '6px 10px', color: '#0f172a', fontWeight: 600, fontSize: 12 }}>
                                    ₽{formatNumber(record.cost || 0)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: '#f8fafc' }}>
                              <td colSpan={3} style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 600, color: '#0f172a', fontSize: 12 }}>
                                Общая стоимость
                              </td>
                              <td style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 700, color: '#d97706', fontSize: 12 }}>
                                ₽{formatNumber(v.repairHistory.reduce((sum, r) => sum + (r.cost || 0), 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                        <p>Нет записей о ремонтах</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── ДОКУМЕНТЫ ─── */}
                {activeTab === 'documents' && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12, textAlign: 'center' }}>
                      Документы
                    </h3>
                    {v.documents.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {v.documents.map((doc, index) => {
                          const status = getDocumentStatus(doc.expiry_date)
                          return (
                            <div key={index} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 16px',
                              background: '#f8fafc',
                              borderRadius: 12,
                              border: '1px solid #f1f5f9',
                              transition: 'all 0.15s',
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ 
                                  fontSize: 14, 
                                  fontWeight: 600, 
                                  color: '#0f172a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                }}>
                                  <FileText size={16} color="#64748b" />
                                  {doc.document_name}
                                </div>
                                <div style={{ 
                                  fontSize: 12, 
                                  color: '#94a3b8',
                                  marginTop: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 16,
                                  flexWrap: 'wrap',
                                }}>
                                  <span>Начало: {new Date(doc.start_date).toLocaleDateString('ru-RU')}</span>
                                  {doc.expiry_date && (
                                    <span>До: {new Date(doc.expiry_date).toLocaleDateString('ru-RU')}</span>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '4px 12px',
                                  borderRadius: 12,
                                  background: status.bg,
                                  color: status.color,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}>
                                  {status.icon}
                                  {status.label}
                                </div>
                                {doc.file_url && (
                                  <a 
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: '4px 14px',
                                      borderRadius: 8,
                                      background: '#2563eb',
                                      color: 'white',
                                      textDecoration: 'none',
                                      fontSize: 11,
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                                  >
                                    Открыть
                                  </a>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                        <FileText size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                        <p>Нет загруженных документов</p>
                        <p style={{ fontSize: 12, color: '#cbd5e1' }}>Добавьте документы через интерфейс</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
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
    <div style={{ minHeight: '100vh', padding: '24px 90px', position: 'relative' }}>
      {/* Заголовок */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>Техника</h1>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>
          {vehicles.length} единиц техники зарегистрировано
        </p>
      </div>

      {/* Поиск и фильтры */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
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
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { value: 'all', label: 'Все' },
            { value: 'soon', label: 'Скоро ТО' },
            { value: 'critical', label: 'Срочно' },
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: filter === item.value ? '#2563eb' : 'white',
                color: filter === item.value ? 'white' : '#64748b',
                boxShadow: filter === item.value ? '0 4px 12px rgba(37,99,235,0.3)' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 24, border: '1px solid #f1f5f9' }}>
          <Truck size={48} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#94a3b8', fontWeight: 500 }}>Техника не найдена</p>
          <p style={{ fontSize: 13, color: '#cbd5e1' }}>Попробуйте изменить параметры поиска</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((v) => (
            <VehicleCard key={v.id} v={v} />
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && selectedVehicle && (
        <VehicleModal
          v={selectedVehicle}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}