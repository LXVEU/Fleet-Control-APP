'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Wrench,
  Shield,
  RefreshCw,
} from 'lucide-react'

/* ================= TYPES ================= */

type VehicleAlert = {
  id: number
  name: string
  license_plate: string
  vehicle_type: string
  meter_type?: string
  current_meter?: number
  maintenance_interval?: number
  last_maintenance_meter?: number
  remaining?: number
}

type DocumentAlert = {
  id: number
  vehicle_id: number
  expiry_date: string | null  // ← Добавлен null
  document_name?: string
  vehicle?: VehicleAlert
}

type MileageAlert = {
  id: number
  name: string
  license_plate: string
  mileage: number
  meter_type?: string
  lastUpdate: string
}

type Props = {
  urgent: VehicleAlert[]
  upcoming: VehicleAlert[]
  documents: DocumentAlert[]
  mileage: MileageAlert[]
}

/* ================= MAIN ================= */

export default function SmartAlerts({
  urgent,
  upcoming,
  documents,
  mileage,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  // Фильтруем документы: только те, у которых есть срок действия
  const validDocuments = documents.filter(doc => doc.expiry_date !== null && doc.expiry_date !== undefined && doc.expiry_date !== '')

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>
          Smart Alerts
        </div>

        <div style={{ fontSize: 13, color: '#9ca3af' }}>
          Важные уведомления
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}
      >
        <UrgentCard data={urgent} expanded={expanded} />
        <UpcomingCard data={upcoming} expanded={expanded} />
        <DocumentsCard data={validDocuments} expanded={expanded} />  {/* ← Передаем отфильтрованные документы */}
        <MileageCard data={mileage} expanded={expanded} />
      </div>

      {(urgent.length > 4 ||
        upcoming.length > 4 ||
        validDocuments.length > 4 ||
        mileage.length > 4) && (
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              marginTop: 16,
              width: '100%',
              height: 42,
              borderRadius: 12,
              border: '1px solid #2563eb',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {expanded ? 'Скрыть' : 'Показать ещё'}

            <span
              style={{
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: expanded
                  ? 'none'
                  : '7px solid white',
                borderBottom: expanded
                  ? '7px solid white'
                  : 'none',
              }}
            />
          </button>
        </div>
      )}
    </div>
  )
}

/* ================= URGENT ================= */

function UrgentCard({
  data,
  expanded,
}: {
  data: VehicleAlert[]
  expanded: boolean
}) {
  const visible = expanded ? data : data.slice(0, 4)

  return (
    <div style={card}>
      <Header icon={<AlertTriangle size={16} color="#ff3b30" />} title="Срочное ТО" color="#ff3b30" bg="#fff1f0" count={data.length} />

      <List>
        {visible.map((v) => (
          <Item key={v.id} bg="#fff1f1" border="#ffd0d0">
            <div style={row}>
              <div>
                <div style={title}>{v.name}</div>
                <div style={sub}>{v.license_plate}</div>
              </div>

              <div style={badgeRed}>CRITICAL</div>
            </div>
          </Item>
        ))}
      </List>
    </div>
  )
}

/* ================= UPCOMING ================= */

function UpcomingCard({
  data,
  expanded,
}: {
  data: VehicleAlert[]
  expanded: boolean
}) {
  const visible = expanded ? data : data.slice(0, 4)

  const getRemainingColor = (remaining: number, interval: number = 10000) => {
    const percent = (remaining / interval) * 100

    if (percent > 20) return '#22c55e'
    if (percent <= 0) return '#ff3b30'

    const ratio = percent / 20
    const r = 255
    const g = Math.round(59 + (168 - 59) * ratio)
    const b = Math.round(48 + (0 - 48) * ratio)

    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <div style={card}>
      <Header icon={<Wrench size={16} color="#ffa800" />} title="Скоро ТО" color="#ffa800" bg="#fffbeb" count={data.length} />

      <List>
        {visible.map((v) => {
          const remaining = v.remaining ?? 0
          const unit = v.meter_type === 'hours' ? 'м/ч' : 'км'
          const color = getRemainingColor(remaining, v.maintenance_interval || 10000)

          return (
            <Item key={v.id} bg="#fffaf0" border="#ffe3a3">
              <div style={row}>
                <div>
                  <div style={title}>{v.name}</div>
                  <div style={sub}>{v.license_plate}</div>
                </div>

                <div style={{ ...rightValue, color }}>
                  {remaining} {unit}
                </div>
              </div>
            </Item>
          )
        })}
      </List>
    </div>
  )
}

/* ================= DOCUMENTS ================= */

function DocumentsCard({
  data,
  expanded,
}: {
  data: DocumentAlert[]
  expanded: boolean
}) {
  const today = new Date()
  const visible = expanded ? data : data.slice(0, 4)

  // Дополнительная фильтрация: только документы с датой окончания
  const validData = data.filter(d => d.expiry_date)

  return (
    <div style={card}>
      <Header icon={<Shield size={16} color="#ff6b00" />} title="Документы" color="#ff6b00" bg="#fff4ed" count={validData.length} />

      <List>
        {validData.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            Нет активных документов
          </div>
        ) : (
          visible.map((d) => {
            const exp = new Date(d.expiry_date!)
            const days = Math.ceil(
              (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )

            const isCritical = days <= 0

            return (
              <Item
                key={d.id}
                bg={isCritical ? '#fff1f1' : '#fff'}
                border={isCritical ? '#ffd0d0' : '#f3f4f6'}
              >
                <div style={row}>
                  <div>
                    <div style={title}>{d.vehicle?.name}</div>
                    <div style={sub}>{d.vehicle?.license_plate}</div>
                    <div style={small}>{d.document_name}</div>
                  </div>

                  {isCritical ? (
                    <div style={badgeRed}>CRITICAL</div>
                  ) : (
                    <div style={rightValue}>{days} д.</div>
                  )}
                </div>
              </Item>
            )
          })
        )}
      </List>
    </div>
  )
}

/* ================= MILEAGE ================= */

function MileageCard({
  data,
  expanded,
}: {
  data: MileageAlert[]
  expanded: boolean
}) {
  const visible = expanded ? data : data.slice(0, 4)

  return (
    <div style={card}>
      <Header icon={<RefreshCw size={16} color="#005bff" />} title="Пробег" color="#005bff" bg="#eef2ff" count={data.length} />

      <List>
        {visible.map((v) => (
          <Item key={v.id}>
            <div style={row}>
              <div>
                <div style={title}>{v.name}</div>
                <div style={sub}>{v.license_plate}</div>
                <div style={small}>
                  {v.mileage.toLocaleString()} {v.meter_type === 'hours' ? 'м/ч' : 'км'}
                </div>
              </div>

              <div style={rightValue}>
                {v.lastUpdate.replace(' дн. назад', '')} д.
              </div>
            </div>
          </Item>
        ))}
      </List>
    </div>
  )
}

/* ================= UI ================= */

const card = {
  background: '#fff',
  borderRadius: 18,
  padding: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
}

const title = {
  fontSize: 14,
  fontWeight: 800,
}

const sub = {
  fontSize: 11,
  color: '#6b7280',
}

const small = {
  fontSize: 11,
  marginTop: 2,
}

const row = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const rightValue = {
  fontSize: 13,
  fontWeight: 800,
}

const badgeRed = {
  fontSize: 10,
  padding: '3px 6px',
  borderRadius: 6,
  background: '#ff3b30',
  color: '#fff',
  fontWeight: 800,
}

function Header({ icon, title, count, color, bg }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>

      <div style={{ fontWeight: 800 }}>{title}</div>

      <div style={{ marginLeft: 'auto', background: color, color: '#fff', fontSize: 11, padding: '2px 7px', borderRadius: 6 }}>
        {count}
      </div>
    </div>
  )
}

function List({ children }: any) {
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
    </div>
  )
}

function Item({ children, bg = '#fff', border = '#f3f4f6' }: any) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: 10 }}>
      {children}
    </div>
  )
}