'use client'

import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

type MaintenanceLog = {
  cost: number
  created_at: string
}

type RepairLog = {
  cost: number
  created_at: string
}

type Props = {
  maintenanceLogs: MaintenanceLog[]
  repairLogs: RepairLog[]
}

type Period = 'week' | 'month' | 'year'

function formatY(value: number) {
  if (value >= 1000) return `${Math.round(value / 1000)}k`
  return value
}

function groupByPeriod(
  logs: { cost: number; created_at: string }[],
  period: Period
) {
  const now = new Date()
  const map: Record<string, number> = {}

  logs.forEach((l) => {
    const d = new Date(l.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    map[key] = (map[key] || 0) + Number(l.cost || 0)
  })

  const result: { label: string; cost: number; fullLabel: string; isToday: boolean }[] = []

  if (period === 'week') {
    const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    const currentDay = now.getDay()

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(now.getDate() - i)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const dayIndex = date.getDay()

      result.push({
        label: weekdays[dayIndex],
        cost: map[key] || 0,
        fullLabel: date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        isToday: i === 0,
      })
    }
  }

  if (period === 'month') {
    const daysInCurrent = now.getDate()

    for (let day = 1; day <= daysInCurrent; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

      result.push({
        label: String(day),
        cost: map[key] || 0,
        fullLabel: date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        isToday: day === daysInCurrent,
      })
    }
  }

  if (period === 'year') {
    const months = [
      'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
      'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ]

    for (let month = 0; month <= now.getMonth(); month++) {
      let total = 0

      logs.forEach((l) => {
        const d = new Date(l.created_at)
        if (
          d.getMonth() === month &&
          d.getFullYear() === now.getFullYear()
        ) {
          total += Number(l.cost || 0)
        }
      })

      result.push({
        label: months[month],
        cost: total,
        fullLabel: months[month],
        isToday: month === now.getMonth(),
      })
    }
  }

  return result
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null

  const point = payload[0].payload

  return (
    <div
      style={{
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(12px)',
        color: '#ffffff',
        padding: '16px 24px',
        borderRadius: 14,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 160,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ 
        fontSize: 13, 
        opacity: 0.6, 
        marginBottom: 6, 
        fontWeight: 500,
        color: '#ffffff',
        letterSpacing: 0.3,
      }}>
        {point.fullLabel}
      </div>

      <div style={{ 
        fontSize: 24, 
        fontWeight: 700, 
        color: '#ffffff',
        letterSpacing: 0.5,
      }}>
        {payload[0].value.toLocaleString('ru-RU')} ₽
      </div>
    </div>
  )
}

export default function ExpensesCharts({
  maintenanceLogs,
  repairLogs,
}: Props) {
  const [period, setPeriod] = useState<Period>('month')

  const data = useMemo(() => {
    const all = [...(maintenanceLogs || []), ...(repairLogs || [])]
    return groupByPeriod(all, period)
  }, [period, maintenanceLogs, repairLogs])

  const total = data.reduce((s, d) => s + d.cost, 0)
  const avg = data.length ? total / data.length : 0
  const max = Math.max(...data.map((d) => d.cost), 0)
  const yMax = Math.ceil(max / 10000) * 10000 + 10000

  // Находим сегодняшнюю точку для пульсирующего эффекта
  const todayData = data.find(d => d.isToday)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* HEADER */}
      <div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#111827',
            lineHeight: 1.1,
          }}
        >
          Smart Charts
        </div>

        <div
          style={{
            fontSize: 14,
            color: '#9ca3af',
            marginTop: 0,
            fontWeight: 500,
          }}
        >
          График расходов
        </div>
      </div>

      {/* MODULE */}
      <div
        style={{
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 24,
          padding: 28,
          height: 600,
          display: 'flex',
          flexDirection: 'column',
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.07), 0 4px 24px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 22,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: '#9ca3af',
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              График расходов автопарка
            </div>

            <div
              style={{
                fontSize: 45,
                fontWeight: 900,
                lineHeight: 1.1,
                marginTop: 8,
                color: '#0f172a',
              }}
            >
              {total.toLocaleString('ru-RU')} ₽
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 4,
              background: '#f1f5f9',
              padding: 4,
              borderRadius: 12,
              height: 'fit-content',
            }}
          >
            {(['week', 'month', 'year'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: period === p ? '#ffffff' : 'transparent',
                  color: period === p ? '#005bff' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: period === p
                    ? '0 2px 8px rgba(0,0,0,0.06)'
                    : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {p === 'week'
                  ? 'Неделя'
                  : p === 'month'
                  ? 'Месяц'
                  : 'Год'}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: 'Среднее',
              value: `${Math.round(avg).toLocaleString('ru-RU')} ₽`,
            },
            {
              label: 'Максимум',
              value: `${max.toLocaleString('ru-RU')} ₽`,
            },
            {
              label: 'Записей',
              value: data.length,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: '#f8fafc',
                borderRadius: 16,
                padding: '14px 18px',
                border: '1px solid #f1f5f9',
              }}
            >
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  marginTop: 4,
                  color: '#0f172a',
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <style>
            {`
              @keyframes pulse {
                0% {
                  r: 6;
                  opacity: 1;
                }
                50% {
                  r: 14;
                  opacity: 0.3;
                }
                100% {
                  r: 6;
                  opacity: 1;
                }
              }
              @keyframes pulseRing {
                0% {
                  r: 6;
                  opacity: 0.8;
                }
                100% {
                  r: 24;
                  opacity: 0;
                }
              }
            `}
          </style>

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#005bff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#005bff" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                stroke="rgba(0,0,0,0.04)" 
                vertical={false}
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />

              <YAxis
                domain={[0, yMax]}
                tickFormatter={formatY}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine
                y={avg}
                stroke="#f59e0b"
                strokeDasharray="6 4"
                strokeWidth={2}
                label={{
                  value: 'Среднее',
                  fill: '#f59e0b',
                  fontSize: 10,
                  fontWeight: 600,
                  position: 'insideRight',
                }}
              />

              <Area
                type="monotone"
                dataKey="cost"
                stroke="#005bff"
                strokeWidth={3.5}
                fill="url(#expenseGradient)"
                dot={false}
                activeDot={false}
              />

              {/* Только сегодняшняя точка с пульсацией */}
              {todayData && (
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="transparent"
                  fill="transparent"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    if (payload.isToday) {
                      return (
                        <g>
                          {/* Пульсирующее кольцо */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill="none"
                            stroke="#005bff"
                            strokeWidth={2.5}
                            opacity={0.8}
                          >
                            <animate
                              attributeName="r"
                              from="6"
                              to="26"
                              dur="1.5s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              from="0.8"
                              to="0"
                              dur="1.5s"
                              repeatCount="indefinite"
                            />
                          </circle>
                          {/* Основная точка */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={7}
                            fill="#005bff"
                            stroke="#ffffff"
                            strokeWidth={3}
                          >
                            <animate
                              attributeName="r"
                              values="7;9;7"
                              dur="1.5s"
                              repeatCount="indefinite"
                            />
                          </circle>
                          {/* Внутренняя точка */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill="#ffffff"
                            opacity={0.9}
                          >
                            <animate
                              attributeName="r"
                              values="3;4;3"
                              dur="1.5s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        </g>
                      )
                    }
                    return null
                  }}
                  activeDot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}