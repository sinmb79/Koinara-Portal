import { useState, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import useStore from '../lib/store.js'
import { Btn, Card, Tag, Badge, Divider, Field, AddrLink } from '../components/ui.jsx'

// ── 카테고리 정의 ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all',       label: '전체',       icon: '◈' },
  { key: 'defi',      label: 'DeFi',       icon: '⬡' },
  { key: 'agent',     label: 'AI 에이전트', icon: '🤖' },
  { key: 'analytics', label: '분석/리서치', icon: '◎' },
  { key: 'tooling',   label: '개발 툴링',   icon: '⚙' },
  { key: 'social',    label: '소셜',       icon: '◉' },
  { key: 'gaming',    label: '게임/엔터',   icon: '◆' },
]

// ── 상태 배지 색상 ────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  live:    'green',
  beta:    'yellow',
  soon:    'dim',
  building:'purple',
}

// ── 초기 DApp 목록 (시드 데이터) ──────────────────────────────────────────────
const SEED_DAPPS = [
  {
    id: 1,
    name: 'InferSwap',
    tagline: 'AI 추론 결과 기반 DEX 라우팅',
    desc: 'Koinara PoI 데이터를 활용해 최적 스왑 경로를 AI가 실시간 분석합니다. 슬리피지 최소화와 MEV 방어를 동시에 달성하세요.',
    category: 'defi',
    status: 'beta',
    url: 'https://inferswap.example',
    contract: '0x1111…aaaa',
    icon: '⬡',
    iconBg: 'rgba(0,200,255,0.12)',
    iconColor: '#00c8ff',
    tags: ['DEX', 'Routing', 'MEV'],
    koinRequired: false,
    stats: { users: '1.2K', volume: '$420K', jobs: '3,801' },
    verified: true,
    featured: true,
  },
  {
    id: 2,
    name: 'ResearchMesh',
    tagline: '분산 리서치 에이전트 네트워크',
    desc: '수백 개의 AI 에이전트가 협력하여 심층 리서치를 수행합니다. Collective 타입 작업을 자동으로 분해하고 병렬 실행합니다.',
    category: 'agent',
    status: 'live',
    url: 'https://researchmesh.example',
    contract: '0x2222…bbbb',
    icon: '◎',
    iconBg: 'rgba(0,255,180,0.10)',
    iconColor: '#00ffb4',
    tags: ['Multi-agent', 'Research', 'Collective'],
    koinRequired: true,
    stats: { users: '890', volume: '—', jobs: '12,440' },
    verified: true,
    featured: true,
  },
  {
    id: 3,
    name: 'AuditAI',
    tagline: '스마트 컨트랙트 자동 보안 감사',
    desc: 'Solidity, Vyper 컨트랙트를 업로드하면 Koinara 네트워크의 보안 전문가들이 집합적으로 감사합니다. PoI 인증 리포트 발행.',
    category: 'tooling',
    status: 'live',
    url: 'https://auditai.example',
    contract: '0x3333…cccc',
    icon: '🛡',
    iconBg: 'rgba(124,58,237,0.12)',
    iconColor: '#a78bfa',
    tags: ['Security', 'Solidity', 'Audit'],
    koinRequired: false,
    stats: { users: '2.1K', volume: '—', jobs: '8,220' },
    verified: true,
    featured: false,
  },
  {
    id: 4,
    name: 'KoinFeed',
    tagline: '온체인 추론 데이터 피드',
    desc: 'Koinara PoI 검증 결과를 오라클로 변환해 다른 스마트 컨트랙트에 공급합니다. 신뢰할 수 있는 AI 추론 결과를 온체인으로.',
    category: 'defi',
    status: 'beta',
    url: null,
    contract: '0x4444…dddd',
    icon: '◈',
    iconBg: 'rgba(255,170,0,0.10)',
    iconColor: '#ffaa00',
    tags: ['Oracle', 'Data Feed', 'PoI'],
    koinRequired: true,
    stats: { users: '340', volume: '—', jobs: '1,890' },
    verified: false,
    featured: false,
  },
  {
    id: 5,
    name: 'NodeDash',
    tagline: '검증자 노드 운영 대시보드',
    desc: '여러 체인에 걸친 Koinara 검증자 노드를 한 곳에서 모니터링하고 관리하세요. 수익 분석과 알림 설정 포함.',
    category: 'tooling',
    status: 'live',
    url: 'https://nodedash.example',
    contract: null,
    icon: '⚙',
    iconBg: 'rgba(0,255,180,0.08)',
    iconColor: '#00ffb4',
    tags: ['Verifier', 'Monitor', 'Dashboard'],
    koinRequired: false,
    stats: { users: '560', volume: '—', jobs: '—' },
    verified: true,
    featured: false,
  },
  {
    id: 6,
    name: 'InferGuild',
    tagline: 'AI 에이전트 길드 & 평판 시스템',
    desc: 'PoI 기록 기반의 온체인 평판 레이어. 고품질 공급자를 발굴하고, 길드를 결성해 집합 작업에 함께 도전하세요.',
    category: 'social',
    status: 'soon',
    url: null,
    contract: null,
    icon: '◉',
    iconBg: 'rgba(124,58,237,0.10)',
    iconColor: '#a78bfa',
    tags: ['Reputation', 'Guild', 'Social'],
    koinRequired: false,
    stats: { users: '—', volume: '—', jobs: '—' },
    verified: false,
    featured: false,
  },
]

// ── DApp 카드 ─────────────────────────────────────────────────────────────────
function DAppCard({ app, featured }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      style={{
        background: featured ? 'linear-gradient(135deg, #0e1628 0%, #0c1220 100%)' : '#0c1220',
        border: `1px solid ${expanded ? 'rgba(0,255,180,.35)' : featured ? 'rgba(0,255,180,.2)' : 'rgba(0,255,180,.10)'}`,
        borderRadius: 14,
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.25s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (!expanded) e.currentTarget.style.borderColor = 'rgba(0,255,180,.25)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { if (!expanded) e.currentTarget.style.borderColor = featured ? 'rgba(0,255,180,.2)' : 'rgba(0,255,180,.10)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Featured glow */}
      {featured && (
        <div style={{
          position:'absolute', top:0, right:0, width:160, height:160,
          background:'radial-gradient(circle at top right, rgba(0,255,180,0.06), transparent 70%)',
          pointerEvents:'none',
        }} />
      )}

      {/* Header */}
      <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:14 }}>
        <div style={{
          width:44, height:44, borderRadius:11,
          background: app.iconBg,
          border:`1px solid ${app.iconColor}30`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'1.2rem', flexShrink:0,
          color: app.iconColor,
          fontFamily:"'Share Tech Mono',monospace",
        }}>
          {app.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1rem', color:'#e8f0ff' }}>
              {app.name}
            </span>
            {app.verified && (
              <span style={{
                fontFamily:'Share Tech Mono', fontSize:'0.6rem', color:'#00ffb4',
                background:'rgba(0,255,180,.08)', border:'1px solid rgba(0,255,180,.2)',
                padding:'1px 6px', borderRadius:4, letterSpacing:'0.08em',
              }}>✓ VERIFIED</span>
            )}
            {featured && (
              <span style={{
                fontFamily:'Share Tech Mono', fontSize:'0.6rem', color:'#ffaa00',
                background:'rgba(255,170,0,.08)', border:'1px solid rgba(255,170,0,.2)',
                padding:'1px 6px', borderRadius:4, letterSpacing:'0.08em',
              }}>★ FEATURED</span>
            )}
          </div>
          <p style={{ fontSize:'0.82rem', color:'#6b7a99', lineHeight:1.45 }}>{app.tagline}</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
          <Badge color={STATUS_COLOR[app.status]}>
            {app.status === 'live' ? '● LIVE' : app.status === 'beta' ? '◑ BETA' : app.status === 'soon' ? '○ SOON' : '◐ BUILDING'}
          </Badge>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
        {app.tags.map(t => (
          <span key={t} style={{
            fontFamily:'Share Tech Mono', fontSize:'0.65rem', color:'#3a4560',
            background:'rgba(58,69,96,.15)', border:'1px solid rgba(58,69,96,.3)',
            padding:'2px 8px', borderRadius:4,
          }}>{t}</span>
        ))}
      </div>

      {/* Stats row */}
      <div style={{
        display:'flex', gap:20,
        paddingTop:12, borderTop:'1px solid rgba(0,255,180,.06)',
      }}>
        {[['사용자', app.stats.users],['거래량', app.stats.volume],['처리 작업', app.stats.jobs]].map(([k,v])=>(
          <div key={k}>
            <div style={{ fontFamily:'Share Tech Mono', fontSize:'0.82rem', color: v==='—' ? '#3a4560' : '#00ffb4' }}>{v}</div>
            <div style={{ fontSize:'0.65rem', color:'#3a4560', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:1 }}>{k}</div>
          </div>
        ))}
        <div style={{ marginLeft:'auto', fontFamily:'Share Tech Mono', fontSize:'0.68rem', color:'#3a4560', alignSelf:'flex-end' }}>
          {expanded ? '▲ 접기' : '▼ 상세'}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid rgba(0,255,180,.08)' }}
          onClick={e => e.stopPropagation()}>
          <p style={{ fontSize:'0.875rem', color:'#6b7a99', lineHeight:1.7, marginBottom:20 }}>
            {app.desc}
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            {app.url && (
              <a href={app.url} target="_blank" rel="noreferrer"
                onClick={e => e.stopPropagation()}>
                <Btn variant="primary" size="sm">앱 열기 ↗</Btn>
              </a>
            )}
            {!app.url && app.status === 'soon' && (
              <Btn variant="ghost" size="sm" disabled>출시 예정</Btn>
            )}
            {app.contract && (
              <span style={{ fontFamily:'Share Tech Mono', fontSize:'0.72rem', color:'#3a4560' }}>
                Contract: <AddrLink addr={app.contract} />
              </span>
            )}
            {app.koinRequired && (
              <span style={{
                fontFamily:'Share Tech Mono', fontSize:'0.68rem', color:'#00ffb4',
                background:'rgba(0,255,180,.06)', border:'1px solid rgba(0,255,180,.15)',
                padding:'2px 8px', borderRadius:4,
              }}>KOIN 사용</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 등록 폼 ───────────────────────────────────────────────────────────────────
function RegisterForm({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    name:'', tagline:'', desc:'', category:'defi',
    url:'', contract:'', tags:'',
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:200,
      background:'rgba(5,8,16,0.92)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20,
    }} onClick={onClose}>
      <div style={{
        background:'#0c1220', border:'1px solid rgba(0,255,180,.3)',
        borderRadius:18, padding:40, maxWidth:580, width:'100%',
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 32px 80px rgba(0,0,0,.6), 0 0 40px rgba(0,255,180,.04)',
      }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <div>
            <div style={{ fontFamily:'Share Tech Mono', fontSize:'0.72rem', color:'#00ffb4', letterSpacing:'0.12em', marginBottom:6 }}>
              // DAPP REGISTRATION
            </div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.3rem', fontWeight:700 }}>
              디앱 등록하기
            </h2>
          </div>
          <button onClick={onClose} style={{
            background:'#111928', border:'1px solid rgba(0,255,180,.1)',
            borderRadius:8, width:32, height:32, color:'#6b7a99',
            fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center',
          }}>✕</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Field label="앱 이름 *">
              <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="MyDApp" />
            </Field>
            <Field label="카테고리 *">
              <select value={form.category} onChange={e=>set('category',e.target.value)}>
                {CATEGORIES.filter(c=>c.key!=='all').map(c=>(
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="한 줄 소개 *">
            <input value={form.tagline} onChange={e=>set('tagline',e.target.value)} placeholder="Koinara 기반 ○○○ 서비스" />
          </Field>
          <Field label="상세 설명 *">
            <textarea rows={4} value={form.desc} onChange={e=>set('desc',e.target.value)}
              placeholder="어떤 문제를 해결하는지, Koinara 프로토콜을 어떻게 활용하는지 설명해 주세요." />
          </Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Field label="앱 URL" hint="없으면 비워두세요">
              <input value={form.url} onChange={e=>set('url',e.target.value)} placeholder="https://" />
            </Field>
            <Field label="컨트랙트 주소 (Worldland)" hint="선택 사항">
              <input value={form.contract} onChange={e=>set('contract',e.target.value)} placeholder="0x…" />
            </Field>
          </div>
          <Field label="태그" hint="쉼표로 구분 (예: DeFi, AMM, KOIN)">
            <input value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="DeFi, AMM, KOIN" />
          </Field>

          {/* Guidelines */}
          <div style={{
            background:'rgba(0,255,180,.04)', border:'1px solid rgba(0,255,180,.12)',
            borderRadius:10, padding:16,
          }}>
            <div style={{ fontFamily:'Share Tech Mono', fontSize:'0.7rem', color:'#00ffb4', marginBottom:10, letterSpacing:'0.08em' }}>
              // 등록 가이드라인
            </div>
            {[
              'Koinara 프로토콜 (InferenceJobRegistry, PoI Verifier 등)을 실제로 사용해야 합니다.',
              '컨트랙트를 Worldland 스캐너에 verified하면 ✓ VERIFIED 배지를 받습니다.',
              '검토 후 승인되면 생태계 페이지에 게시됩니다.',
            ].map((g,i) => (
              <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:'0.8rem', color:'#6b7a99' }}>
                <span style={{ color:'rgba(0,255,180,.4)', flexShrink:0 }}>—</span>
                <span>{g}</span>
              </div>
            ))}
          </div>

          <Btn variant="primary" full size="lg"
            onClick={() => { onSubmit(form); onClose() }}
            disabled={!form.name || !form.tagline || !form.desc}>
            등록 신청 →
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ── 개발자 리소스 섹션 ────────────────────────────────────────────────────────
function DevResources() {
  const resources = [
    {
      icon:'◈', title:'SDK / ethers.js 연동',
      desc:'InferenceJobRegistry, PoI Verifier 컨트랙트를 JavaScript/TypeScript에서 바로 사용하는 코드 예제.',
      tag:'DOCS', color:'#00ffb4',
    },
    {
      icon:'⬡', title:'Worldland 컨트랙트 주소',
      desc:'메인넷 배포된 5개 컨트랙트 주소와 검증된 ABI를 한 곳에서 확인하세요.',
      tag:'REFERENCE', color:'#00c8ff',
    },
    {
      icon:'◎', title:'PoI 이벤트 인덱싱',
      desc:'POIIssued, JobSubmitted 이벤트를 구독해 실시간으로 추론 결과를 내 앱에 통합하는 방법.',
      tag:'GUIDE', color:'#a78bfa',
    },
    {
      icon:'⚙', title:'테스트넷 (Worldland Gwangju)',
      desc:'메인넷 배포 전 Gwangju 테스트넷에서 자유롭게 실험하세요. 수도꼭지(faucet) 포함.',
      tag:'TESTNET', color:'#ffaa00',
    },
  ]

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.2rem', fontWeight:700, marginBottom:6 }}>개발자 리소스</h2>
      <p style={{ color:'#6b7a99', fontSize:'0.875rem', marginBottom:24 }}>
        Koinara 프로토콜 위에 디앱을 구축하기 위한 도구와 문서
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14 }}>
        {resources.map(r => (
          <div key={r.title} style={{
            background:'#0c1220', border:'1px solid rgba(0,255,180,.08)',
            borderRadius:12, padding:'20px', cursor:'pointer',
            transition:'all .2s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(0,255,180,.22)';e.currentTarget.style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(0,255,180,.08)';e.currentTarget.style.transform='translateY(0)'}}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <span style={{ fontFamily:'Share Tech Mono', fontSize:'1.1rem', color:r.color }}>{r.icon}</span>
              <span style={{
                fontFamily:'Share Tech Mono', fontSize:'0.62rem', color:r.color,
                background:`${r.color}15`, border:`1px solid ${r.color}30`,
                padding:'2px 7px', borderRadius:4,
              }}>{r.tag}</span>
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:'0.9rem', marginBottom:8 }}>{r.title}</div>
            <p style={{ fontSize:'0.8rem', color:'#6b7a99', lineHeight:1.55 }}>{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────
export default function DApps() {
  const { address } = useStore()
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [dapps, setDapps] = useState(SEED_DAPPS)
  const [activeTab, setActiveTab] = useState('explore') // explore | dev

  const filtered = useMemo(() => {
    return dapps.filter(d => {
      const matchCat = category === 'all' || d.category === category
      const q = search.toLowerCase()
      const matchQ = !q || d.name.toLowerCase().includes(q) || d.tagline.toLowerCase().includes(q) || d.tags.some(t=>t.toLowerCase().includes(q))
      return matchCat && matchQ
    })
  }, [dapps, category, search])

  const featured = filtered.filter(d => d.featured)
  const rest     = filtered.filter(d => !d.featured)

  const handleRegister = (form) => {
    const newApp = {
      id: Date.now(),
      name: form.name,
      tagline: form.tagline,
      desc: form.desc,
      category: form.category,
      status: 'soon',
      url: form.url || null,
      contract: form.contract || null,
      icon: '◈',
      iconBg: 'rgba(0,255,180,0.08)',
      iconColor: '#00ffb4',
      tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
      koinRequired: false,
      stats: { users:'—', volume:'—', jobs:'—' },
      verified: false,
      featured: false,
    }
    setDapps(prev => [...prev, newApp])
    toast.success(`"${form.name}" 등록 신청 완료! 검토 후 게시됩니다.`)
  }

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'100px 40px 80px' }}>

      {/* ── 헤더 ── */}
      <div style={{ marginBottom:48 }}>
        <Tag>생태계</Tag>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:20, marginBottom:32 }}>
          <div>
            <h1 style={{
              fontFamily:"'Syne',sans-serif", fontSize:'clamp(1.8rem,4vw,2.6rem)',
              fontWeight:800, letterSpacing:'-0.02em', lineHeight:1.1, marginBottom:10,
            }}>
              Koinara <span style={{ background:'linear-gradient(90deg, #00ffb4, #00c8ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                생태계
              </span>
            </h1>
            <p style={{ color:'#6b7a99', fontSize:'0.95rem', maxWidth:520, lineHeight:1.65 }}>
              Koinara 프로토콜 위에서 동작하는 디앱들. 추론 마켓플레이스, AI 에이전트, DeFi, 툴링 — 생태계가 여기서 시작됩니다.
            </p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <Btn variant="outline" onClick={() => setShowForm(true)}>
              + 디앱 등록
            </Btn>
            {address && (
              <Btn variant="primary" onClick={() => setShowForm(true)}>
                내 디앱 제출
              </Btn>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display:'flex', gap:4, borderBottom:'1px solid rgba(0,255,180,.1)', marginBottom:32 }}>
          {[['explore','탐색'],['dev','개발자']].map(([k,l])=>(
            <button key={k} onClick={()=>setActiveTab(k)} style={{
              fontFamily:"'DM Sans',sans-serif", fontSize:'0.85rem',
              padding:'10px 20px', background:'transparent', border:'none',
              color: activeTab===k ? '#00ffb4' : '#6b7a99',
              borderBottom: activeTab===k ? '2px solid #00ffb4' : '2px solid transparent',
              cursor:'pointer', transition:'all .2s', marginBottom:-1,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {activeTab === 'explore' && (
        <>
          {/* ── 필터 바 ── */}
          <div style={{ display:'flex', gap:12, marginBottom:32, flexWrap:'wrap', alignItems:'center' }}>
            {/* 카테고리 필터 */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={()=>setCategory(c.key)} style={{
                  fontFamily:"'DM Sans',sans-serif", fontSize:'0.78rem',
                  padding:'7px 14px', borderRadius:100,
                  border:`1px solid ${category===c.key ? '#00ffb4' : 'rgba(0,255,180,.12)'}`,
                  background: category===c.key ? 'rgba(0,255,180,.07)' : 'transparent',
                  color: category===c.key ? '#00ffb4' : '#6b7a99',
                  cursor:'pointer', transition:'all .2s',
                  display:'flex', alignItems:'center', gap:5,
                }}>
                  <span style={{ fontSize:'0.7rem' }}>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
            {/* 검색 */}
            <div style={{ position:'relative', width:200 }}>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="검색…"
                style={{ paddingLeft:32, width:'100%' }}
              />
              <span style={{
                position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
                color:'#3a4560', fontSize:'0.8rem', pointerEvents:'none',
              }}>⌕</span>
            </div>
          </div>

          {/* ── Featured ── */}
          {featured.length > 0 && (
            <div style={{ marginBottom:40 }}>
              <div style={{ fontFamily:'Share Tech Mono', fontSize:'0.7rem', color:'#ffaa00', letterSpacing:'0.12em', marginBottom:16 }}>
                ★ FEATURED
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(420px, 1fr))', gap:16 }}>
                {featured.map(d => <DAppCard key={d.id} app={d} featured />)}
              </div>
            </div>
          )}

          {/* ── All apps ── */}
          {rest.length > 0 && (
            <div>
              <div style={{ fontFamily:'Share Tech Mono', fontSize:'0.7rem', color:'#3a4560', letterSpacing:'0.1em', marginBottom:16 }}>
                ALL DAPPS ({rest.length})
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:14 }}>
                {rest.map(d => <DAppCard key={d.id} app={d} featured={false} />)}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'80px 0', color:'#3a4560' }}>
              <div style={{ fontFamily:'Share Tech Mono', fontSize:'2rem', marginBottom:12 }}>∅</div>
              <div style={{ fontSize:'0.875rem' }}>검색 결과가 없습니다.</div>
            </div>
          )}

          {/* ── CTA banner ── */}
          <div style={{
            marginTop:56,
            background:'linear-gradient(135deg, rgba(0,255,180,.05), rgba(0,200,255,.03))',
            border:'1px solid rgba(0,255,180,.15)',
            borderRadius:16, padding:'40px 48px',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            flexWrap:'wrap', gap:24,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{
              position:'absolute', top:-40, right:-40,
              width:240, height:240,
              background:'radial-gradient(circle, rgba(0,255,180,.06), transparent 70%)',
              pointerEvents:'none',
            }} />
            <div>
              <div style={{ fontFamily:'Share Tech Mono', fontSize:'0.72rem', color:'#00ffb4', letterSpacing:'0.12em', marginBottom:10 }}>
                // BUILD ON KOINARA
              </div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.4rem', marginBottom:8 }}>
                당신의 디앱을 이 생태계에
              </h3>
              <p style={{ color:'#6b7a99', fontSize:'0.875rem', maxWidth:420, lineHeight:1.65 }}>
                Koinara의 분산 추론 인프라 위에 구축하세요. InferenceJobRegistry, PoI 검증, KOIN 보상을 그대로 활용할 수 있습니다.
              </p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <Btn variant="primary" size="lg" onClick={() => setShowForm(true)}>
                디앱 등록하기 →
              </Btn>
              <Btn variant="ghost" size="lg" onClick={() => setActiveTab('dev')}>
                개발자 문서 보기
              </Btn>
            </div>
          </div>
        </>
      )}

      {activeTab === 'dev' && (
        <DevResources />
      )}

      {/* ── 등록 모달 ── */}
      {showForm && (
        <RegisterForm
          onClose={() => setShowForm(false)}
          onSubmit={handleRegister}
        />
      )}
    </div>
  )
}
