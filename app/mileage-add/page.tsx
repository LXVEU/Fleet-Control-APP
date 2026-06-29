import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import MileageForm from './MileageForm'

export default function MileageAddPage() {
  return (
    <Suspense
      fallback={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          background: '#f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', padding: '20px 28px', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
            <span style={{ color: '#64748b', fontWeight: 500 }}>Загрузка...</span>
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      }
    >
      <MileageForm />
    </Suspense>
  )
}