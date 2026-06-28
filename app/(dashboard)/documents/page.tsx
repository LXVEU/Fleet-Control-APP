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
  File,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Upload,
  Link2,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCompanyId } from '@/lib/company'

type Document = {
  id: string
  vehicle_id: number
  document_name: string
  start_date: string
  expiry_date?: string
  file_url?: string
  created_at: string
  company_id: string
  vehicles?: {
    id: number
    name: string
    license_plate: string
    vehicle_type: string
    meter_type?: string
  }
}

type Vehicle = {
  id: number
  name: string
  license_plate: string
  vehicle_type: string
  meter_type?: string
}

type DocWithVehicle = Document & {
  vehicle_name?: string
  license_plate?: string
  vehicle_type?: string
  status_label?: string
  status_color?: string
  status_bg?: string
  status_border?: string
  status_icon?: React.ReactNode
  days_remaining?: number | null
}

export default function DocumentsPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<DocWithVehicle[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  const [showFileModal, setShowFileModal] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [submittingFile, setSubmittingFile] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

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
      const [vehRes, docRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('company_id', companyId),
        supabase
          .from('documents')
          .select(`
            *,
            vehicles (
              id,
              name,
              license_plate,
              vehicle_type,
              meter_type
            )
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
      ])

      if (vehRes.error) console.error('Ошибка загрузки техники:', vehRes.error)
      else setVehicles(vehRes.data || [])

      if (docRes.error) {
        console.error('Ошибка загрузки документов:', docRes.error)
        setDocs([])
      } else {
        const docsWithData = (docRes.data || []).map((doc: any) => {
          const vehicle = doc.vehicles as any
          
          let status_label = 'Без срока'
          let status_color = '#94a3b8'
          let status_bg = '#f8fafc'
          let status_border = '#e2e8f0'
          let status_icon = null
          let days_remaining = null

          if (doc.expiry_date) {
            const now = new Date()
            const expiry = new Date(doc.expiry_date)
            const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            days_remaining = diffDays

            if (diffDays < 0) {
              status_label = 'Срочно'
              status_color = '#dc2626'
              status_bg = '#fef2f2'
              status_border = '#dc2626'
              status_icon = <XCircle size={14} color="#dc2626" />
            } else if (diffDays <= 30) {
              status_label = `Скоро ${diffDays} дн.`
              status_color = '#d97706'
              status_bg = '#fffbeb'
              status_border = '#d97706'
              status_icon = <AlertTriangle size={14} color="#d97706" />
            } else {
              status_label = 'Норма'
              status_color = '#059669'
              status_bg = '#ecfdf5'
              status_border = '#059669'
              status_icon = <CheckCircle size={14} color="#059669" />
            }
          }

          return {
            ...doc,
            vehicle_name: vehicle?.name || `ID: ${doc.vehicle_id}`,
            license_plate: vehicle?.license_plate || '-',
            vehicle_type: vehicle?.vehicle_type || '-',
            status_label,
            status_color,
            status_bg,
            status_border,
            status_icon,
            days_remaining,
          }
        })
        setDocs(docsWithData)
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const openFileModal = (docId: string) => {
    setSelectedDocId(docId)
    setFileUrl('')
    setFileError(null)
    setShowFileModal(true)
  }

  const handleSaveFile = async () => {
    if (!selectedDocId) return
    
    if (!fileUrl.trim()) {
      setFileError('Введите ссылку на файл')
      return
    }
    
    try {
      new URL(fileUrl)
    } catch {
      setFileError('Введите корректную ссылку (начинается с http:// или https://)')
      return
    }

    setSubmittingFile(true)
    setFileError(null)

    try {
      const { error } = await supabase
        .from('documents')
        .update({ file_url: fileUrl.trim() })
        .eq('id', selectedDocId)

      if (error) throw error

      setDocs(docs.map(doc => 
        doc.id === selectedDocId 
          ? { ...doc, file_url: fileUrl.trim() }
          : doc
      ))

      setShowFileModal(false)
      setFileUrl('')
      setSelectedDocId(null)
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Ошибка сохранения файла')
    } finally {
      setSubmittingFile(false)
    }
  }

  const filteredDocs = docs.filter(doc => {
    const searchLower = search.toLowerCase()
    return (
      doc.document_name?.toLowerCase().includes(searchLower) ||
      doc.vehicle_name?.toLowerCase().includes(searchLower) ||
      doc.license_plate?.toLowerCase().includes(searchLower)
    )
  })

  const sortedDocs = [...filteredDocs].sort((a, b) => {
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
    
    if (sortField === 'document_name') {
      const aVal = a.document_name || ''
      const bVal = b.document_name || ''
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    if (sortField === 'start_date') {
      const aVal = a.start_date || ''
      const bVal = b.start_date || ''
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    if (sortField === 'expiry_date') {
      const aVal = a.expiry_date || ''
      const bVal = b.expiry_date || ''
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    if (sortField === 'status') {
      const aVal = a.status_label || ''
      const bVal = b.status_label || ''
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
    })
  }

  const totalDocs = docs.length

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
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>Документы</h1>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>
            {totalDocs} документов всего
          </p>
        </div>
        <button
          onClick={() => router.push('/documents/add')}
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
          Добавить документ
        </button>
      </div>

      {/* Поиск */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Поиск по названию, документу или номеру..."
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
                    Дата добавления
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
                  style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('document_name')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Наименование
                    {sortField === 'document_name' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('start_date')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                    Начало
                    {sortField === 'start_date' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('expiry_date')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                    Конец
                    {sortField === 'expiry_date' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('status')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                    Статус
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Файл
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                    <FileText size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                    <p>Нет загруженных документов</p>
                    <p style={{ fontSize: 13, color: '#cbd5e1' }}>Добавьте первый документ</p>
                  </td>
                </tr>
              ) : (
                sortedDocs.map((doc, index) => {
                  const hasFileUrl = doc.file_url && doc.file_url.trim() !== ''
                  
                  // Определяем стиль для даты окончания
                  let expiryDateStyle = {
                    color: '#0f172a',
                    fontWeight: 700,
                  }
                  
                  if (doc.days_remaining !== undefined && doc.days_remaining !== null) {
                    if (doc.days_remaining < 0) {
                      expiryDateStyle = {
                        color: '#dc2626',
                        fontWeight: 700,
                      }
                    } else if (doc.days_remaining <= 30) {
                      expiryDateStyle = {
                        color: '#d97706',
                        fontWeight: 700,
                      }
                    } else {
                      expiryDateStyle = {
                        color: '#059669',
                        fontWeight: 700,
                      }
                    }
                  }
                  
                  return (
                    <tr 
                      key={doc.id} 
                      style={{ 
                        borderBottom: index < sortedDocs.length - 1 ? '1px solid #f1f5f9' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {formatDate(doc.created_at)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                        {doc.vehicle_name || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontFamily: 'monospace', color: '#0f172a', letterSpacing: '0.5px' }}>
                        {doc.license_plate || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <File size={14} color="#64748b" />
                          {doc.document_name}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {doc.start_date ? formatDate(doc.start_date) : '—'}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center', 
                        fontSize: 13, 
                        whiteSpace: 'nowrap',
                        color: expiryDateStyle.color,
                        fontWeight: expiryDateStyle.fontWeight,
                      }}>
                        {doc.expiry_date ? formatDate(doc.expiry_date) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: doc.status_bg || '#f8fafc',
                          color: doc.status_color || '#94a3b8',
                          border: `1px solid ${doc.status_border || '#e2e8f0'}`,
                        }}>
                          {doc.status_icon}
                          {doc.status_label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {hasFileUrl ? (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 12px',
                              borderRadius: 8,
                              background: '#e0e7ff',
                              color: '#1e40af',
                              textDecoration: 'none',
                              fontSize: 12,
                              fontWeight: 600,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#bfdbfe'
                              e.currentTarget.style.transform = 'scale(1.02)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#e0e7ff'
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                          >
                            <ExternalLink size={14} />
                            Открыть
                          </a>
                        ) : (
                          <button
                            onClick={() => openFileModal(doc.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 12px',
                              borderRadius: 8,
                              background: '#f1f5f9',
                              color: '#64748b',
                              border: '1px solid #e2e8f0',
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#e2e8f0'
                              e.currentTarget.style.transform = 'scale(1.02)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f1f5f9'
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                          >
                            <Upload size={14} />
                            Добавить файл
                          </button>
                        )}
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
            Показано {sortedDocs.length} из {totalDocs} документов
          </span>
          <button
            onClick={() => router.push('/documents/add')}
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
            Добавить документ
          </button>
        </div>
      </div>

      {/* ─── МОДАЛЬНОЕ ОКНО ДЛЯ ДОБАВЛЕНИЯ ФАЙЛА ─── */}
      {showFileModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
          onClick={() => {
            setShowFileModal(false)
            setFileError(null)
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 24,
              padding: 32,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                Добавить ссылку на файл
              </h2>
              <button
                onClick={() => {
                  setShowFileModal(false)
                  setFileError(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  color: '#94a3b8',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
              Введите ссылку на файл документа
            </p>

            {fileError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#dc2626',
                fontSize: 13,
                marginBottom: 16,
              }}>
                {fileError}
              </div>
            )}

            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Link2 size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="url"
                placeholder="https://example.com/document.pdf"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
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

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowFileModal(false)
                  setFileError(null)
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#64748b',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                Отмена
              </button>
              <button
                onClick={handleSaveFile}
                disabled={submittingFile}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: submittingFile ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  opacity: submittingFile ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!submittingFile) e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {submittingFile ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  'Сохранить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}