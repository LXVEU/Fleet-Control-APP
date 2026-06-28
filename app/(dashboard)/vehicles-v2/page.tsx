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
  category?: string
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
  
  // Состояния
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [mileageLogs, setMileageLogs] = useState<MileageLog[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [repairLogs, setRepairLogs] = useState<RepairLog[]>([])
  
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDetail | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // ─── ЗАГРУЗКА ДАННЫХ ───
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const companyId = await getCompanyId()

    if (!companyId) {
      setLoading(false)
      return
    }

    const [vehRes, mileRes, maintRes] = await Promise.all([
      supabase.from('vehicles').select('*').eq('company_id', companyId),
      supabase.from('mileage_logs').select('*').eq('company_id', companyId),
      supabase.from('maintenance_logs').select('*').eq('company_id', companyId),
    ])

    setVehicles(vehRes.data || [])
    setMileageLogs(mileRes.data || [])
    setMaintenanceLogs(maintRes.data || [])
    setLoading(false)
  }

  // ─── ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ───
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

    const activities: Activity[] = [
      ...vehicleMileageLogs.slice(0, 2).map(log => ({
        date: log.created_at,
        description: `Mileage updated to ${formatNumber(log.meter_value)} ${unit}`,
        type: 'mileage' as const
      })),
      ...vehicleMaintenanceLogs.slice(0, 2).map(log => ({
        date: log.created_at,
        description: log.description || `Maintenance at ${formatNumber(log.meter_value)} ${unit}`,
        type: 'maintenance' as const
      }))
    ].slice(0, 5)

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
      activities: activities,
      maintenanceHistory: vehicleMaintenanceLogs,
      repairHistory: [],
    }
  }

  // ─── ФИЛЬТРАЦИЯ ───
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

  // ─── СТАТИСТИКА ───
  const stats = useMemo(() => {
    const total = filtered.length
    const active = filtered.filter(v => getTOStatus(v).status === 'active').length
    const warning = filtered.filter(v => getTOStatus(v).status === 'warning').length
    const critical = filtered.filter(v => getTOStatus(v).status === 'critical').length
    
    return { total, active, warning, critical }
  }, [filtered])

  // ─── ОТКРЫТИЕ МОДАЛКИ ───
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
    
    const st = {
      active: { label: 'Active', color: 'text-emerald-600 bg-emerald-50', dot: 'bg-emerald-500' },
      warning: { label: 'Service Due', color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-500' },
      critical: { label: 'Critical', color: 'text-red-600 bg-red-50', dot: 'bg-red-500' },
    }[to.status]

    const pct = Math.min(((current - getLastTO(v)) / (v.maintenance_interval || 10000)) * 100, 100)

    return (
      <div
        onClick={() => handleVehicleClick(v)}
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{v.name}</h3>
            <p className="text-sm text-slate-500">{v.vehicle_type}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xs px-3 py-1 rounded-full ${st.color} font-medium`}>
              {st.label}
            </span>
            <span className="text-xs text-slate-400 font-mono mt-1">{v.license_plate}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-50 p-2 rounded-lg text-center">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Current</div>
            <div className="text-sm font-bold text-slate-800">{formatNumber(current)}</div>
            <div className="text-[10px] text-slate-400">{unit}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg text-center">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Last SVC</div>
            <div className="text-sm font-bold text-slate-800">{formatNumber(getLastTO(v))}</div>
            <div className="text-[10px] text-slate-400">{unit}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg text-center">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Next SVC</div>
            <div className="text-sm font-bold text-slate-800">{formatNumber(to.nextTO)}</div>
            <div className="text-[10px] text-slate-400">{unit}</div>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span className="font-medium">
              {to.remaining > 0 ? `${formatNumber(to.remaining)} ${unit}` : 'Service Due!'}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                to.critical ? 'bg-red-500' : 
                to.soon ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Until next service: <span className="font-semibold text-slate-700">
              {formatNumber(to.remaining)} {unit}
            </span>
          </span>
          <span className="text-blue-600 text-sm font-medium hover:text-blue-700 transition flex items-center gap-1">
            Details <ChevronRight className="w-4 h-4" />
          </span>
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
    const st = {
      active: { label: 'Active', color: 'text-emerald-600 bg-emerald-50', dot: 'bg-emerald-500' },
      warning: { label: 'Service Due', color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-500' },
      critical: { label: 'Critical', color: 'text-red-600 bg-red-50', dot: 'bg-red-500' },
    }[v.status]

    useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }, [onClose])

    const tabs = [
      { id: 'overview', label: 'Overview', icon: ClipboardList },
      { id: 'maintenance', label: 'Maintenance', icon: Settings },
      { id: 'repairs', label: 'Repairs', icon: Wrench },
      { id: 'documents', label: 'Documents', icon: FileText },
    ]

    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full">
            {/* ЛЕВАЯ ПАНЕЛЬ */}
            <div className="w-80 bg-slate-50 p-6 border-r border-slate-200 flex-shrink-0 overflow-y-auto">
              <button
                onClick={onClose}
                className="float-right p-1 hover:bg-slate-200 rounded-full transition mb-4"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">{v.name}</h2>
                <p className="text-sm text-slate-500">{v.vehicle_type}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${st.dot}`}></span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${st.color} font-medium`}>
                    {st.label}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{v.license_plate}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-medium">Current Mileage</div>
                  <div className="text-2xl font-bold text-slate-900">{formatNumber(v.currentMeter)}</div>
                  <div className="text-xs text-slate-400">{v.unit}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-medium">Last Service</div>
                  <div className="text-lg font-semibold text-slate-900">{formatNumber(v.lastService)} {v.unit}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-medium">Next Target</div>
                  <div className="text-lg font-semibold text-slate-900">{formatNumber(v.nextService)} {v.unit}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl">
                  <div className="text-xs text-blue-600 uppercase font-medium">Remaining</div>
                  <div className="text-2xl font-bold text-blue-900">{formatNumber(v.remaining)}</div>
                  <div className="text-xs text-blue-600">{v.unit}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 uppercase font-medium mb-2">Fleet Summary</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2 rounded-lg text-center">
                    <div className="text-xs text-slate-400">Services</div>
                    <div className="text-lg font-bold text-slate-800">{v.maintenanceHistory.length}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg text-center">
                    <div className="text-xs text-slate-400">Repairs</div>
                    <div className="text-lg font-bold text-slate-800">{v.repairHistory.length}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg text-center">
                    <div className="text-xs text-slate-400">Svc Cost</div>
                    <div className="text-lg font-bold text-emerald-600">
                      ${formatNumber(v.maintenanceHistory.reduce((sum, m) => sum + (m.cost || 0), 0))}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg text-center">
                    <div className="text-xs text-slate-400">Rep Cost</div>
                    <div className="text-lg font-bold text-amber-600">
                      ${formatNumber(v.repairHistory.reduce((sum, r) => sum + (r.cost || 0), 0))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ПРАВАЯ ПАНЕЛЬ */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="border-b border-slate-200 mb-6">
                <div className="flex gap-6">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`pb-3 text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Activity</h3>
                    <div className="space-y-3">
                      {v.activities.length > 0 ? (
                        v.activities.map((activity, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-700">{activity.description}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(activity.date).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <p>No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'maintenance' && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Maintenance History</h3>
                    {v.maintenanceHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Meter</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Description</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase">Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {v.maintenanceHistory.map((record, index) => (
                              <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-2 px-3 text-slate-700">
                                  {new Date(record.created_at).toLocaleDateString('ru-RU')}
                                </td>
                                <td className="py-2 px-3 text-slate-700">{formatNumber(record.meter_value)} {v.unit}</td>
                                <td className="py-2 px-3 text-slate-700">{record.description || '-'}</td>
                                <td className="py-2 px-3 text-right font-medium text-slate-700">
                                  ${formatNumber(record.cost || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50">
                              <td colSpan={3} className="py-2 px-3 text-right font-semibold text-slate-700">Total cost</td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-600">
                                ${formatNumber(v.maintenanceHistory.reduce((sum, m) => sum + (m.cost || 0), 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <p>No maintenance records</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'repairs' && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Repair History</h3>
                    <div className="text-center py-8 text-slate-400">
                      <p>No repair records yet</p>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Documents</h3>
                    <div className="text-center py-8 text-slate-400">
                      <p>No documents uploaded yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── ЗАГРУЗКА ───
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-slate-600 font-medium">Загрузка данных...</span>
        </div>
      </div>
    )
  }

  // ─── ОСНОВНОЙ РЕНДЕР ───
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🚛 Техника</h1>
          <p className="text-sm text-slate-400">
            {vehicles.length} единиц техники зарегистрировано
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по названию или номеру..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Все' },
              { value: 'soon', label: 'Скоро ТО' },
              { value: 'critical', label: 'Срочно' },
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  filter === item.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Всего', value: stats.total, color: 'bg-blue-50 border-blue-200' },
          { label: 'В норме', value: stats.active, color: 'bg-emerald-50 border-emerald-200' },
          { label: 'Скоро ТО', value: stats.warning, color: 'bg-amber-50 border-amber-200' },
          { label: 'Срочно', value: stats.critical, color: 'bg-red-50 border-red-200' },
        ].map((s) => (
          <div
            key={s.label}
            className={`p-4 rounded-xl border ${s.color} transition-transform hover:scale-105`}
          >
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-600 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* GRID */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Техника не найдена</p>
          <p className="text-sm text-slate-300">Попробуйте изменить параметры поиска</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <VehicleCard key={v.id} v={v} />
          ))}
        </div>
      )}

      {/* MODAL - без анимаций */}
      {showModal && selectedVehicle && (
        <VehicleModal
          v={selectedVehicle}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}