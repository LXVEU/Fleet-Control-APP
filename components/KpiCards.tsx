'use client'

import {
  Truck,
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

type Props = {
  totalVehicles: number
  urgentTO: number
  upcomingTO: number
  docs: {
    expired: number
    soon: number
  }
  costs: string
  costTrend: number
  health: number
}

export default function KpiCards({
  totalVehicles,
  urgentTO,
  upcomingTO,
  docs,
  costs,
  costTrend,
}: Props) {
  // Формируем текст тренда для расходов
  let trendText = ''
  let trendIcon = null
  
  if (costTrend > 0) {
    trendText = `+${Math.round(costTrend)}% к прошлому мес.`
    trendIcon = <TrendingUp size={14} color="#ff3b30" />
  } else if (costTrend < 0) {
    trendText = `${Math.round(costTrend)}% к прошлому мес.`
    trendIcon = <TrendingDown size={14} color="#22c55e" />
  } else {
    trendText = 'Без изменений'
    trendIcon = null
  }

  const kpiCards = [
    {
      id: 'total',
      label: 'Всего техники',
      value: totalVehicles,
      sub: '+ обновлено',
      icon: Truck,
      color: '#005bff',
      bg: '#eef2ff',
    },
    {
      id: 'urgent',
      label: 'Срочно ТО',
      value: urgentTO,
      sub: 'Нужно действие',
      icon: AlertTriangle,
      color: '#ff3b30',
      bg: '#fff1f0',
    },
    {
      id: 'upcoming',
      label: 'Скоро ТО',
      value: upcomingTO,
      sub: 'Скоро обслуживание',
      icon: Clock,
      color: '#ffa800',
      bg: '#fffbeb',
    },
    {
      id: 'docs',
      label: 'Документы',
      value: `${docs.expired} / ${docs.soon}`,
      sub: 'просрочено / скоро',
      icon: FileText,
      color: '#8b5cf6',
      bg: '#f5f3ff',
    },
    {
      id: 'costs',
      label: 'Расходы',
      value: costs,
      sub: trendText,
      trendIcon: trendIcon,
      icon: DollarSign,
      color: '#22c55e',
      bg: '#f0fdf4',
    },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 16,
        marginBottom: 20,
      }}
    >
      {kpiCards.map((card) => {
        const Icon = card.icon

        return (
          <div
            key={card.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 28,
              padding: 20,
              minHeight: 180,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow:
                '0 10px 30px rgba(2,6,23,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: card.bg,
                }}
              >
                <Icon size={18} color={card.color} />
              </div>

              {card.trendIcon && card.trendIcon}
            </div>

            <div>
              <div
                style={{
                  fontSize: 35,
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                }}
              >
                {card.value}
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#6b7280',
                  marginTop: -8,
                }}
              >
                {card.label}
              </div>
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '6px 5px',
                borderRadius: 12,
                alignSelf: 'flex-start',
                transform: 'translateX(-5px)',
                backgroundColor: card.bg,
                color: card.color,
                marginTop: 35,
              }}
            >
              {card.sub}
            </div>
          </div>
        )
      })}
    </div>
  )
}