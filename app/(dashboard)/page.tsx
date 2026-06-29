'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { getCompanyId } from '../lib/company'
import KpiCards from '../../components/KpiCards'
import SmartAlerts from '../../components/SmartAlerts'
import ExpensesCharts from '../../components/ExpensesCharts'
import FailureAnalytics from '../../components/FailureAnalytics'
import LogoutButton from '../../components/LogoutButton'

type Vehicle = {
  id: number
  name: string
  license_plate: string
  vehicle_type: string
  meter_type?: string
  maintenance_interval: number
}

type Document = {
  id: number
  vehicle_id: number
  expiry_date: string
  document_name?: string
  vehicle?: {
    id: number
    name: string
    license_plate: string
  }
}

type MileageLog = {
  id: number
  license_plate: string
  meter_value: number
  created_at: string
}

type MaintenanceLog = {
  id: number
  license_plate: string
  meter_value: number
  cost: number
  created_at: string
}

type RepairLog = {
  id: number
  cost: number
  created_at: string
  license_plate: string
  category_id: number
}

type RepairCategory = {
  id: number
  name: string
}

export default function Home() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [mileageLogs, setMileageLogs] = useState<MileageLog[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [repairLogs, setRepairLogs] = useState<RepairLog[]>([])
  const [repairCategories, setRepairCategories] = useState<RepairCategory[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ─── ПРОВЕРКА АВТОРИЗАЦИИ ───
  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    await loadCompanyAndData()
  }

  async function loadCompanyAndData() {
    const id = await getCompanyId()
    setCompanyId(id)

    if (!id) {
      setLoading(false)
      return
    }

    await loadData(id)
    setLoading(false)
  }

  async function loadData(companyId: string) {
    const [
      vehRes,
      docRes,
      mileRes,
      maintRes,
      repairRes,
      categoryRes,
    ] = await Promise.all([
      supabase
        .from('vehicles')
        .select('*')
        .eq('company_id', companyId),

      supabase
        .from('documents')
        .select(`
          id,
          vehicle_id,
          expiry_date,
          document_name,
          vehicle:vehicles (
            id,
            name,
            license_plate
          )
        `)
        .eq('company_id', companyId),

      supabase
        .from('mileage_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),

      supabase
        .from('maintenance_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),

      supabase
        .from('repair_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),

      supabase
        .from('repair_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name'),
    ])

    setVehicles(vehRes.data || [])
    setDocuments(docRes.data || [])
    setMileageLogs(mileRes.data || [])
    setMaintenanceLogs(maintRes.data || [])
    setRepairLogs(repairRes.data || [])
    setRepairCategories(categoryRes.data || [])
    setLoading(false)
  }

  const getCurrentMeter = (v: Vehicle) => {
    const logs = mileageLogs
      .filter(l => l.license_plate === v.license_plate)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )

    return Number(logs[0]?.meter_value ?? 0)
  }

  const getLastTO = (v: Vehicle) => {
    const logs = maintenanceLogs
      .filter(l => l.license_plate === v.license_plate)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )

    return Number(logs[0]?.meter_value ?? 0)
  }

  const getTOStatus = (v: Vehicle) => {
    const current = getCurrentMeter(v)
    const interval = Number(v.maintenance_interval || 10000)
    const lastTO = getLastTO(v)

    const nextTO = lastTO + interval
    const remaining = nextTO - current

    return {
      remaining,
      isUrgent: remaining <= 0,
      isSoon: remaining > 0 && remaining <= interval * 0.2,
    }
  }

  const getDocStatus = (date: string) => {
    const exp = new Date(date)
    const diffDays =
      (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)

    return {
      expired: diffDays < 0,
      soon: diffDays <= 30 && diffDays >= 0,
    }
  }

  const getMileageStatus = (v: Vehicle) => {
    const logs = mileageLogs
      .filter(l => l.license_plate === v.license_plate)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )

    const last = logs[0]
    if (!last) return null

    const days =
      (Date.now() - new Date(last.created_at).getTime()) /
      (1000 * 60 * 60 * 24)

    if (days < 2) return null

    return {
      id: v.id,
      name: v.name,
      license_plate: v.license_plate,
      mileage: last.meter_value,
      meter_type: v.meter_type,
      lastUpdate: `${Math.floor(days)} дн. назад`,
    }
  }

  const urgentTO = vehicles.filter(v => getTOStatus(v).isUrgent).length
  const upcomingTO = vehicles.filter(v => getTOStatus(v).isSoon).length

  let expiredDocs = 0
  let soonDocs = 0

  documents.forEach(doc => {
    const status = getDocStatus(doc.expiry_date)
    if (status.expired) expiredDocs++
    else if (status.soon) soonDocs++
  })

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const currentMonthExpenses = [...maintenanceLogs, ...repairLogs]
    .filter(log => {
      const date = new Date(log.created_at)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, log) => sum + Number(log.cost || 0), 0)

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const prevMonthExpenses = [...maintenanceLogs, ...repairLogs]
    .filter(log => {
      const date = new Date(log.created_at)
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear
    })
    .reduce((sum, log) => sum + Number(log.cost || 0), 0)

  let trend = 0
  if (prevMonthExpenses > 0) {
    trend = ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100
  } else if (currentMonthExpenses > 0) {
    trend = 100
  }

  const costString = `${currentMonthExpenses.toLocaleString('ru-RU')} ₽`
  const costTrend = Math.round(trend)

  const getHealth = (v: Vehicle) => {
    let score = 100
    const to = getTOStatus(v)

    if (to.isUrgent) score -= 40
    else if (to.isSoon) score -= 20

    return Math.max(0, score)
  }

  const health =
    vehicles.length > 0
      ? Math.round(
          vehicles.reduce((s, v) => s + getHealth(v), 0) /
            vehicles.length
        )
      : 0

  const upcomingWithRemaining = vehicles
    .filter(v => getTOStatus(v).isSoon)
    .map(v => ({
      ...v,
      remaining: getTOStatus(v).remaining,
    }))

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        color: '#6b7280',
      }}>
        Загрузка...
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '30px 90px',
        fontFamily: 'Arial',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* Заголовок страницы */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#0d1117',
            }}
          >
            Dashboard
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#9ca3af',
              marginTop: 2,
            }}
          >
            Панель управления
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <LogoutButton />
        </div>
      </div>

      <KpiCards
        totalVehicles={vehicles.length}
        urgentTO={urgentTO}
        upcomingTO={upcomingTO}
        docs={{ expired: expiredDocs, soon: soonDocs }}
        costs={costString}
        costTrend={costTrend}
        health={health}
      />

      <div style={{ marginTop: 30 }}>
        <SmartAlerts
          urgent={vehicles.filter(v => getTOStatus(v).isUrgent)}
          upcoming={upcomingWithRemaining}
          documents={documents}
          mileage={
            vehicles.map(getMileageStatus).filter(Boolean) as any
          }
        />
      </div>

      <div
        style={{
          marginTop: 30,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          alignItems: 'stretch',
        }}
      >
        <div style={{ height: '100%' }}>
          <ExpensesCharts
            maintenanceLogs={maintenanceLogs || []}
            repairLogs={repairLogs || []}
          />
        </div>

        <div style={{ height: '100%' }}>
          <FailureAnalytics
            repairLogs={repairLogs}
            repairCategories={repairCategories}
            vehicles={vehicles}
          />
        </div>
      </div>
    </div>
  )
}