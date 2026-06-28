'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { TrendingUp, Truck } from 'lucide-react'

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

type Vehicle = {
  id: number
  name: string
  license_plate: string
}

type Props = {
  repairLogs: RepairLog[]
  repairCategories: RepairCategory[]
  vehicles: Vehicle[]
}

type Mode = 'count' | 'cost'

function formatValue(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${Math.round(value / 1000)}k`
  return value
}

function CustomTooltip({ active, payload, mode }: any) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload
  const value = payload[0].value

  return (
    <div
      style={{
        background: '#111827',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      }}
    >
      {item.licensePlate ? (
        <>
          <div style={{ fontWeight: 800 }}>{item.name}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {item.licensePlate}
          </div>
        </>
      ) : (
        <div style={{ fontWeight: 800 }}>{item.name}</div>
      )}

      <div style={{ fontWeight: 800, marginTop: 4 }}>
        {mode === 'count'
          ? `${value} ремонтов`
          : `${Number(value).toLocaleString('ru-RU')} ₽`}
      </div>
    </div>
  )
}

function MetricToggle({
  value,
  onChange,
}: {
  value: Mode
  onChange: (mode: Mode) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: 2,
        borderRadius: 12,
        background: '#f0f2f5',
      }}
    >
      {[
        ['count', 'По ремонтам'],
        ['cost', 'По затратам'],
      ].map(([mode, label]) => (
        <button
          key={mode}
          onClick={() => onChange(mode as Mode)}
          style={{
            border: 'none',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 700,
            transition: 'all .2s ease',
            background: value === mode ? '#fff' : 'transparent',
            color: value === mode ? '#0d1117' : '#9ca3af',
            boxShadow:
              value === mode
                ? '0 1px 3px rgba(0,0,0,0.1)'
                : 'none',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function FailureAnalytics({
  repairLogs,
  repairCategories,
  vehicles,
}: Props) {
  const [mode, setMode] = useState<Mode>('count')

  const categoryColors = [
    '#005bff',
    '#0ea5e9',
    '#f59e0b',
    '#22c55e',
    '#8b5cf6',
  ]

  const vehicleColors = [
    '#ff3b30',
    '#f59e0b',
    '#fbbf24',
    '#22c55e',
    '#10b981',
  ]

  const currentYearLogs = useMemo(() => {
    const now = new Date()

    return repairLogs.filter(log => {
      const date = new Date(log.created_at)
      return date.getFullYear() === now.getFullYear()
    })
  }, [repairLogs])

  const categoryData = useMemo(() => {
    const map: Record<
      string,
      { name: string; count: number; cost: number }
    > = {}

    currentYearLogs.forEach(log => {
      const category = repairCategories.find(
        c => c.id === log.category_id
      )

      const name = category?.name || 'Без категории'

      if (!map[name]) {
        map[name] = { name, count: 0, cost: 0 }
      }

      map[name].count += 1
      map[name].cost += Number(log.cost || 0)
    })

    return Object.values(map)
      .sort((a, b) =>
        mode === 'count' ? b.count - a.count : b.cost - a.cost
      )
      .slice(0, 5)
      .map((item, index) => ({
        name: item.name,
        value: mode === 'count' ? item.count : item.cost,
        color: categoryColors[index],
      }))
  }, [currentYearLogs, repairCategories, mode])

  const vehicleData = useMemo(() => {
    const map: Record<
      string,
      {
        name: string
        licensePlate: string
        count: number
        cost: number
      }
    > = {}

    currentYearLogs.forEach(log => {
      const vehicle = vehicles.find(
        v => v.license_plate === log.license_plate
      )

      const vehicleName = vehicle?.name || log.license_plate

      if (!map[log.license_plate]) {
        map[log.license_plate] = {
          name: vehicleName,
          licensePlate: log.license_plate,
          count: 0,
          cost: 0,
        }
      }

      map[log.license_plate].count += 1
      map[log.license_plate].cost += Number(log.cost || 0)
    })

    return Object.values(map)
      .sort((a, b) =>
        mode === 'count' ? b.count - a.count : b.cost - a.cost
      )
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        value: mode === 'count' ? item.count : item.cost,
        color: vehicleColors[index],
      }))
  }, [currentYearLogs, mode, vehicles])

  const cardStyle = {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: 24,
    padding: 18,
    boxShadow:
      '0 1px 3px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.03)',
  } as const

  // Кастомный рендер для оси Y второго графика
  const renderVehicleTick = (props: any) => {
    const { x, y, payload } = props
    const item = vehicleData.find(d => d.name === payload.value)
    
    if (!item) return null

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-8}
          y={-4}
          dy={0}
          textAnchor="end"
          style={{
            fontSize: 12,
            fontWeight: 700,
            fill: '#374151',
          }}
        >
          {item.name}
        </text>
        <text
          x={-8}
          y={8}
          dy={0}
          textAnchor="end"
          style={{
            fontSize: 9,
            fontWeight: 400,
            fill: '#9ca3af',
          }}
        >
          {item.licensePlate}
        </text>
      </g>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 2,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            Failure Analytics
          </div>

          <div
            style={{
              fontSize: 13,
              color: '#9ca3af',
              marginTop: 2,
            }}
          >
            Анализ ремонтов за текущий год
          </div>
        </div>

        <MetricToggle value={mode} onChange={setMode} />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#eef2ff',
            }}
          >
            <TrendingUp size={16} color="#005bff" />
          </div>

          <div>
            <div style={{ fontWeight: 800 }}>Топ 5 категорий ремонтов</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              С начала года
            </div>
          </div>
        </div>

        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={categoryData}
              margin={{ top: 0, right: 16, left: -20, bottom: 0 }}
              barSize={14}
              barCategoryGap={4}
            >
              <CartesianGrid stroke="rgba(0,0,0,0.04)" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={formatValue}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 13, fill: '#374151', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip mode={mode} />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff1f0',
            }}
          >
            <Truck size={16} color="#ff3b30" />
          </div>

          <div>
            <div style={{ fontWeight: 800 }}>
              Самые проблемные транспортные средства
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              С начала года
            </div>
          </div>
        </div>

        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={vehicleData}
              margin={{ top: 0, right: 16, left: -20, bottom: 0 }}
              barSize={14}
              barCategoryGap={4}
            >
              <CartesianGrid stroke="rgba(0,0,0,0.04)" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={formatValue}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={renderVehicleTick}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip mode={mode} />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {vehicleData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}