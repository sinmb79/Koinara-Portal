import { useState } from 'react'
import { Link } from 'react-router-dom'
import useStore from '../lib/store.js'
import { useT } from '../lib/i18n.js'
import { usePolling } from '../hooks/usePolling.js'
import JobCard from '../components/JobCard.jsx'
import { Spinner, Empty } from '../components/ui.jsx'

export default function Marketplace() {
  const { jobs, isLoadingJobs, loadJobs, lang } = useStore()
  const t = useT(lang)
  const [filter, setFilter] = useState('all')

  usePolling(loadJobs, 15000, true)

  const FILTERS = [
    { key:'all',        label: t('mp_filter_all') },
    { key:'open',       label: t('mp_filter_open') },
    { key:'simple',     label: t('mp_filter_simple') },
    { key:'general',    label: t('mp_filter_general') },
    { key:'collective', label: t('mp_filter_collective') },
  ]

  const filtered = jobs.filter(j => {
    if (filter === 'open')       return j.state === 0
    if (filter === 'simple')     return j.jobType === 0
    if (filter === 'general')    return j.jobType === 1
    if (filter === 'collective') return j.jobType === 2
    return true
  })

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'100px 40px 80px' }}>
      <div style={{ marginBottom:48 }}>
        <span style={{ display:'inline-block', fontFamily:"'Share Tech Mono',monospace", fontSize:'0.72rem', color:'#00ffb4',
          letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:16, padding:'4px 12px',
          border:'1px solid rgba(0,255,180,.25)', borderRadius:4 }}>
          {t('mp_tag')}
        </span>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:20 }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'2rem', fontWeight:800, letterSpacing:'-0.02em', marginBottom:8 }}>
              {t('mp_title')}
            </h1>
            <p style={{ color:'#6b7a99', fontSize:'0.95rem' }}>{t('mp_jobs_count', jobs.length)}</p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                fontFamily:"'DM Sans',sans-serif", fontSize:'0.78rem', padding:'6px 14px', borderRadius:100,
                border:`1px solid ${filter===f.key ? '#00ffb4' : 'rgba(0,255,180,.12)'}`,
                background: filter===f.key ? 'rgba(0,255,180,.06)' : 'transparent',
                color: filter===f.key ? '#00ffb4' : '#6b7a99',
                cursor:'pointer', transition:'all .2s',
              }}>{f.label}</button>
            ))}
          </div>
        </div>
      </div>

      {isLoadingJobs && jobs.length === 0 ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <Empty message={t('mp_empty')} />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:20 }}>
          {filtered.map(job => <JobCard key={job.id} job={job} lang={lang} />)}
        </div>
      )}

      <div style={{ textAlign:'center', marginTop:40, fontSize:'0.75rem', color:'#3a4560', fontFamily:'Share Tech Mono' }}>
        <span style={{ color:'rgba(0,255,180,.4)' }}>●</span> {t('mp_auto_refresh')}
      </div>
    </div>
  )
}
