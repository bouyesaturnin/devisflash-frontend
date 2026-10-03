import { useEffect, useState, useCallback, useRef } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || '/api'

/* ================================================================
   AUTH
   ================================================================ */
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('df_access')
  const headers = { ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  let res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    const refresh = localStorage.getItem('df_refresh')
    if (refresh) {
      const rr = await fetch(`${API.replace(/\/api$/, '')}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (rr.ok) {
        const data = await rr.json()
        localStorage.setItem('df_access', data.access)
        headers['Authorization'] = `Bearer ${data.access}`
        res = await fetch(url, { ...options, headers })
      } else {
        localStorage.removeItem('df_access')
        localStorage.removeItem('df_refresh')
        window.location.reload()
      }
    }
  }
  return res
}

function LoginScreen({ onLogin }) {
  const [tab, setTab]           = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const switchTab = (t) => { setTab(t); setError(''); setSuccessMsg('') }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await fetch(`${API.replace(/\/api$/, '')}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!r.ok) { setError('Identifiants incorrects.'); return }
      const { access, refresh } = await r.json()
      localStorage.setItem('df_access', access)
      localStorage.setItem('df_refresh', refresh)
      onLogin()
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccessMsg('')
    try {
      const r = await fetch(`${API}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.erreur || 'Erreur lors de la création du compte.'); return }
      setSuccessMsg(data.message + ' Connectez-vous maintenant.')
      setPassword('')
      setEmail('')
      setTimeout(() => switchTab('login'), 2500)
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon"><Icon name="spark" size={20} /></div>
          <span className="logo-name">DevisFlash</span>
        </div>
        <div className="login-tabs">
          <button className={`login-tab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>Connexion</button>
          <button className={`login-tab${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>Créer un compte</button>
        </div>

        {tab === 'login' ? (
          <>
            <p className="login-sub">Accès réservé à votre espace artisan</p>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label className="form-label">Nom d'utilisateur</label>
                <input className="form-input" type="text" value={username} onChange={e => setUsername(e.target.value)} autoFocus required />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && <div className="login-error"><Icon name="warning" size={14} />{error}</div>}
              <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
                {loading ? <><div className="spinner-sm" style={{ borderTopColor: 'white' }} /> Connexion…</> : 'Se connecter'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="login-sub">Créez votre espace artisan gratuit</p>
            <form onSubmit={handleRegister} className="login-form">
              <div className="form-group">
                <label className="form-label">Nom d'utilisateur</label>
                <input className="form-input" type="text" value={username} onChange={e => setUsername(e.target.value)} autoFocus required />
              </div>
              <div className="form-group">
                <label className="form-label">Email (optionnel)</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                <span className="field-hint">6 caractères minimum</span>
              </div>
              {error && <div className="login-error"><Icon name="warning" size={14} />{error}</div>}
              {successMsg && <div className="login-success"><Icon name="check" size={14} />{successMsg}</div>}
              <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
                {loading ? <><div className="spinner-sm" style={{ borderTopColor: 'white' }} /> Création…</> : 'Créer mon compte'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* ================================================================
   ICONS
   ================================================================ */
const Icon = ({ name, size = 16 }) => {
  const s = { width: size, height: size }
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    home:      <svg {...s} viewBox="0 0 24 24" {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    fileText:  <svg {...s} viewBox="0 0 24 24" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    plus:      <svg {...s} viewBox="0 0 24 24" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    users:     <svg {...s} viewBox="0 0 24 24" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    settings:  <svg {...s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    bell:      <svg {...s} viewBox="0 0 24 24" {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    user:      <svg {...s} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    arrowLeft: <svg {...s} viewBox="0 0 24 24" {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    check:     <svg {...s} viewBox="0 0 24 24" {...p} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    warning:   <svg {...s} viewBox="0 0 24 24" {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    trash:     <svg {...s} viewBox="0 0 24 24" {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    print:     <svg {...s} viewBox="0 0 24 24" {...p}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    eye:       <svg {...s} viewBox="0 0 24 24" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    file:      <svg {...s} viewBox="0 0 24 24" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    spark:     <svg {...s} viewBox="0 0 24 24" {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    edit:      <svg {...s} viewBox="0 0 24 24" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    refresh:   <svg {...s} viewBox="0 0 24 24" {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    x:         <svg {...s} viewBox="0 0 24 24" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    phone:     <svg {...s} viewBox="0 0 24 24" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.67a16 16 0 0 0 5.42 5.42l.91-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    mail:      <svg {...s} viewBox="0 0 24 24" {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    search:    <svg {...s} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    list:      <svg {...s} viewBox="0 0 24 24" {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    package:   <svg {...s} viewBox="0 0 24 24" {...p}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    copy:      <svg {...s} viewBox="0 0 24 24" {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    menu:      <svg {...s} viewBox="0 0 24 24" {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    download:  <svg {...s} viewBox="0 0 24 24" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  }
  return icons[name] ?? null
}

/* ================================================================
   STATUS BADGE
   ================================================================ */
const STATUT_LABELS = { brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé' }

function StatusBadge({ statut }) {
  return (
    <span className={`badge badge-${statut}`}>
      <span className="badge-dot" />
      {STATUT_LABELS[statut] ?? statut}
    </span>
  )
}

/* ================================================================
   MODAL
   ================================================================ */
function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

/* ================================================================
   TOAST
   ================================================================ */
function Toast({ toasts, onClose }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <Icon name={t.type === 'success' ? 'check' : 'warning'} size={15} />
          {t.text}
          <button className="toast-close" onClick={() => onClose(t.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

/* ================================================================
   DEVIS DOCUMENT (vue impression)
   ================================================================ */
function DevisDocument({ devisId, onRetour, showToast }) {
  const [devis, setDevis]           = useState(null)
  const [artisan, setArtisan]       = useState(null)
  const [erreur, setErreur]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [emailModal, setEmailModal] = useState(false)
  const [emailMsg, setEmailMsg]     = useState('')
  const [emailSending, setEmailSending] = useState(false)

  useEffect(() => {
    setLoading(true)
    setErreur(null)
    Promise.all([
      authFetch(`${API}/devis/${devisId}/`).then(r => { if (!r.ok) throw new Error('Devis introuvable.'); return r.json() }),
      authFetch(`${API}/artisan-profil/`).then(r => { if (!r.ok) throw new Error(); return r.json() }),
    ])
      .then(([d, a]) => { setDevis(d); setArtisan(a[0] ?? null) })
      .catch(e => setErreur(e.message || 'Erreur de chargement.'))
      .finally(() => setLoading(false))
  }, [devisId])

  const handleEnvoyerEmail = async () => {
    setEmailSending(true)
    try {
      const r = await authFetch(`${API}/devis/${devisId}/envoyer-email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_perso: emailMsg }),
      })
      const data = await r.json()
      if (!r.ok) {
        showToast && showToast('error', data.erreur || "Erreur lors de l'envoi.")
      } else {
        showToast && showToast('success', data.message)
        setDevis(prev => ({ ...prev, statut: data.statut }))
        setEmailModal(false)
        setEmailMsg('')
      }
    } catch {
      showToast && showToast('error', "Erreur réseau lors de l'envoi.")
      setEmailMsg('')
    } finally {
      setEmailSending(false)
    }
  }

  if (loading) return (
    <div className="loading-screen"><div className="spinner" /><span>Chargement du devis…</span></div>
  )
  if (erreur) return (
    <div className="error-screen">
      <Icon name="warning" size={36} /><p>{erreur}</p>
      <button className="btn btn-outline btn-sm" onClick={onRetour}>Retour</button>
    </div>
  )

  const totalHT  = devis.lignes.reduce((a, l) => a + parseFloat(l.quantite) * parseFloat(l.prix_unitaire), 0)
  const totalTVA = devis.lignes.reduce((a, l) => a + parseFloat(l.quantite) * parseFloat(l.prix_unitaire) * (parseFloat(l.tva) / 100), 0)
  const totalTTC = totalHT + totalTVA

  return (
    <div className="document-wrapper">
      <div className="document-toolbar">
        <button className="btn btn-ghost" onClick={onRetour}>
          <Icon name="arrowLeft" size={15} /> Retour
        </button>
        <div className="toolbar-right">
          <StatusBadge statut={devis.statut} />
          <button className="btn btn-outline btn-sm" onClick={() => {
            const prev = document.title; document.title = devis.numero; window.print(); setTimeout(() => { document.title = prev }, 600)
          }}>
            <Icon name="print" size={14} /> Imprimer
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setEmailModal(true)}>
            <Icon name="mail" size={14} /> Envoyer par email
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            const prev = document.title; document.title = devis.numero; window.print(); setTimeout(() => { document.title = prev }, 600)
          }}>
            <Icon name="download" size={14} /> Enregistrer PDF
          </button>
        </div>
      </div>

      {emailModal && (
        <div className="modal-overlay" onClick={() => !emailSending && setEmailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Icon name="mail" size={16} /> Envoyer le devis par email</h3>
              <button className="modal-close" onClick={() => !emailSending && setEmailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {devis.client_email ? (
                <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '14px' }}>
                  Le devis <strong>{devis.numero}</strong> sera envoyé à{' '}
                  <strong>{devis.client_nom}</strong> ({devis.client_email}).
                  Un PDF sera joint en pièce jointe.
                </p>
              ) : (
                <div style={{ margin: '0 0 16px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Icon name="warning" size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ margin: 0, color: '#b91c1c', fontSize: '13px' }}>
                    Le client <strong>{devis.client_nom}</strong> n'a pas d'adresse email. Ajoutez-en une dans sa fiche avant d'envoyer.
                  </p>
                </div>
              )}
              <div className="field">
                <label className="field-label">Message personnalisé (optionnel)</label>
                <textarea
                  className="field-input"
                  rows={4}
                  placeholder="Ex : Bonjour, veuillez trouver ci-joint notre devis suite à notre rendez-vous…"
                  value={emailMsg}
                  onChange={e => setEmailMsg(e.target.value)}
                  disabled={emailSending}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEmailModal(false)} disabled={emailSending}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleEnvoyerEmail} disabled={emailSending || !devis.client_email}>
                {emailSending ? <><div className="spinner-sm" style={{ borderTopColor: 'white' }} /> Envoi…</> : <><Icon name="mail" size={14} /> Envoyer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="document-page">
        <div className="doc-header">
          <div className="doc-artisan">
            {artisan ? (
              <>
                <div className="artisan-name">{artisan.nom_entreprise}</div>
                <div className="artisan-detail">{artisan.adresse}</div>
                <div className="artisan-detail">SIRET : {artisan.siret}{artisan.tva_intracommunautaire && ` — TVA intra : ${artisan.tva_intracommunautaire}`}</div>
                <div className="artisan-detail">Tél : {artisan.telephone}{artisan.email && ` — ${artisan.email}`}</div>
                {artisan.assurance_nom && (
                  <div className="artisan-detail assurance">
                    Assurance décennale : {artisan.assurance_nom}, police n° {artisan.assurance_police_numero}
                    {artisan.assurance_zone_couverture && ` (${artisan.assurance_zone_couverture})`}
                  </div>
                )}
              </>
            ) : (
              <div className="artisan-warning">
                <Icon name="warning" size={13} /> Aucun profil artisan — ajoutez-en un dans l'admin Django.
              </div>
            )}
          </div>
          <div className="doc-meta">
            <div className="doc-title">DEVIS</div>
            <div className="doc-numero">{devis.numero}</div>
            <div className="doc-date">
              {new Date(devis.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="doc-divider" />

        <div className="doc-client">
          <div className="client-label">Destinataire</div>
          <div className="client-nom">{devis.client_nom}</div>
          <div className="client-adresse">{devis.client_adresse}</div>
          {devis.chantier_adresse && <div className="client-chantier">Chantier : {devis.chantier_adresse}</div>}
        </div>

        {devis.objet && (
          <div className="doc-objet">
            {devis.objet}
          </div>
        )}

        <table className="doc-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th className="col-num">Qté</th>
              <th className="col-num">P.U. HT</th>
              <th className="col-num">TVA</th>
              <th className="col-num">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes.map((l, i) => (
              <tr key={l.id} className={i % 2 === 0 ? 'row-even' : ''}>
                <td>{l.description}</td>
                <td className="num">{fmt(l.quantite)}</td>
                <td className="num">{fmt(l.prix_unitaire)} €</td>
                <td className="num">{l.tva}%</td>
                <td className="num">{fmt(parseFloat(l.quantite) * parseFloat(l.prix_unitaire))} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="doc-totaux">
          <div className="total-row"><span>Total HT</span><span className="total-val">{fmt(totalHT)} €</span></div>
          <div className="total-row"><span>Total TVA</span><span className="total-val">{fmt(totalTVA)} €</span></div>
          <div className="total-row total-ttc"><span>Total TTC</span><span className="total-val">{fmt(totalTTC)} €</span></div>
        </div>

        <div className="doc-footer">
          <p>Devis valable {artisan?.validite_devis_jours ?? 30} jours à compter de sa date d'émission.</p>
          {artisan?.mentions_paiement && <p>{artisan.mentions_paiement}</p>}
          <p>Pour accord, veuillez retourner ce document signé avec la mention « Bon pour accord ».</p>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   DASHBOARD
   ================================================================ */
function Dashboard({ allDevis, loadingDevis, artisan, onViewDevis, onNewDevis, onConfigureProfil, onEditDevis, onDeleteDevis, onDupliquerDevis }) {
  const total     = allDevis.length
  const envoyes   = allDevis.filter(d => d.statut === 'envoye').length
  const acceptes  = allDevis.filter(d => d.statut === 'accepte').length
  const refuses   = allDevis.filter(d => d.statut === 'refuse').length
  const montantTotal = allDevis.reduce((a, d) => a + parseFloat(d.total_ht || 0), 0)
  const recent = [...allDevis].sort((a, b) => b.id - a.id).slice(0, 8)

  /* Données graphique — 6 derniers mois */
  const now = new Date()
  const moisData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const yr = d.getFullYear(), mo = d.getMonth()
    const devisMois = allDevis.filter(dv => {
      const dd = new Date(dv.date_creation)
      return dd.getFullYear() === yr && dd.getMonth() === mo
    })
    return {
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      total: devisMois.reduce((s, dv) => s + parseFloat(dv.total_ht || 0), 0),
      count: devisMois.length,
      isCurrent: yr === now.getFullYear() && mo === now.getMonth(),
    }
  })
  const maxTotal = Math.max(...moisData.map(m => m.total), 1)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bonjour 👋</h1>
          <p className="page-sub">Voici l'état de vos devis</p>
        </div>
        <button className="btn btn-primary" onClick={onNewDevis}>
          <Icon name="plus" size={15} /> Créer un devis
        </button>
      </div>

      {!artisan && (
        <div className="alert-banner alert-warning">
          <Icon name="warning" size={15} />
          <span>Profil artisan non configuré — les mentions légales n'apparaîtront pas sur vos devis.</span>
          <button className="alert-action" onClick={onConfigureProfil}>Configurer →</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total devis</div>
          <div className="stat-value">{total}</div>
          <span className="stat-chip primary"><Icon name="fileText" size={11} /> Tous statuts</span>
        </div>
        <div className="stat-card">
          <div className="stat-label">Envoyés</div>
          <div className="stat-value">{envoyes}</div>
          <span className="stat-chip info">En attente</span>
        </div>
        <div className="stat-card">
          <div className="stat-label">Acceptés</div>
          <div className="stat-value">{acceptes}</div>
          <span className="stat-chip success">Signés</span>
        </div>
        <div className="stat-card">
          <div className="stat-label">Montant HT total</div>
          <div className="stat-value" style={{ fontSize: montantTotal > 99999 ? '20px' : undefined }}>
            {fmt(montantTotal)} €
          </div>
          <span className="stat-chip primary">Cumulé</span>
        </div>
      </div>

      {!loadingDevis && allDevis.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <span className="card-title">Revenus HT — 6 derniers mois</span>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'var(--ff-mono)' }}>
              {fmt(montantTotal)} € cumulé
            </span>
          </div>
          <div style={{ padding: '0.5rem 1rem 1rem' }}>
            <svg viewBox="0 0 360 110" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
              {moisData.map((m, i) => {
                const barH = Math.max((m.total / maxTotal) * 72, m.total > 0 ? 4 : 0)
                const x = i * 60 + 8
                const y = 80 - barH
                return (
                  <g key={i}>
                    <rect x={x} y={80} width={44} height={1} fill="var(--border)" />
                    {m.total > 0 && (
                      <rect x={x} y={y} width={44} height={barH}
                        fill={m.isCurrent ? 'var(--primary)' : 'var(--primary-dim)'}
                        stroke={m.isCurrent ? 'var(--primary-dark)' : 'var(--primary)'}
                        strokeWidth={m.isCurrent ? 1.5 : 1}
                        rx="4" />
                    )}
                    {m.total > 0 && (
                      <text x={x + 22} y={y - 5} textAnchor="middle" fontSize="9.5" fill="var(--text-2)" fontFamily="var(--ff-mono)">
                        {m.total >= 1000 ? `${(m.total / 1000).toFixed(1)}k` : Math.round(m.total)}
                      </text>
                    )}
                    <text x={x + 22} y="97" textAnchor="middle" fontSize="11" fill={m.isCurrent ? 'var(--primary)' : 'var(--text-2)'}
                      fontWeight={m.isCurrent ? '600' : '400'} fontFamily="var(--ff-body)">
                      {m.label}
                    </text>
                    {m.count > 0 && (
                      <text x={x + 22} y="108" textAnchor="middle" fontSize="9" fill="var(--text-2)" fontFamily="var(--ff-body)">
                        {m.count} dev.
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Devis récents</span>
          {refuses > 0 && (
            <span className="stat-chip error" style={{ fontSize: '11.5px', padding: '0.2rem 0.6rem' }}>
              {refuses} refusé{refuses > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loadingDevis ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}>
            <div className="spinner" />
          </div>
        ) : recent.length === 0 ? (
          <div className="empty-table">
            <Icon name="file" size={32} style={{ opacity: 0.3 }} />
            <p style={{ marginTop: '0.75rem' }}>Aucun devis pour l'instant.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={onNewDevis}>
              <Icon name="plus" size={13} /> Créer le premier
            </button>
          </div>
        ) : (
          <table className="devis-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Total HT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recent.map(d => (
                <tr key={d.id} onClick={() => onViewDevis(d.id)} style={{ cursor: 'pointer' }}>
                  <td><span className="devis-numero">{d.numero}</span></td>
                  <td>{d.client_nom}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: '12.5px' }}>
                    {new Date(d.date_creation).toLocaleDateString('fr-FR')}
                  </td>
                  <td><StatusBadge statut={d.statut} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="devis-amount">{fmt(d.total_ht)} €</span>
                  </td>
                  <td style={{ textAlign: 'right', width: '140px' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onViewDevis(d.id) }} title="Voir">
                        <Icon name="eye" size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onEditDevis(d) }} title="Modifier">
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onDupliquerDevis(d) }} title="Dupliquer">
                        <Icon name="copy" size={14} />
                      </button>
                      <button className="btn btn-danger-ghost" onClick={e => { e.stopPropagation(); onDeleteDevis(d) }} title="Supprimer">
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   NOUVEAU DEVIS FORM
   ================================================================ */
function NouveauDevisView({ clients, materiaux, onSuccess, editDevisId = null, onDirtyChange, metierPrefill = 'plomberie' }) {
  const [numero, setNumero]                   = useState('')
  const [clientId, setClientId]               = useState('')
  const [chantierAdresse, setChantierAdresse] = useState('')
  const [chantierId, setChantierId]           = useState(null)
  const [objet, setObjet]                     = useState('')
  const [metier, setMetier]                   = useState(metierPrefill)
  const [statut, setStatut]                   = useState('brouillon')
  const [lignes, setLignes]                   = useState([])
  const [saving, setSaving]                   = useState(false)
  const [message, setMessage]                 = useState({ type: '', text: '' })
  const [generatingNum, setGeneratingNum]     = useState(false)
  const [loadingEdit, setLoadingEdit]         = useState(false)
  const [originalLigneIds, setOriginalLigneIds] = useState([])
  const loadedRef = useRef(false)

  const isEdit = editDevisId !== null

  const markDirty = useCallback(() => {
    if (loadedRef.current) onDirtyChange?.(true)
  }, [onDirtyChange])

  const genererNumero = useCallback(async () => {
    setGeneratingNum(true)
    try {
      const r = await authFetch(`${API}/generate-numero/`)
      const data = await r.json()
      setNumero(data.numero)
    } catch {
      /* silencieux — l'utilisateur peut taper manuellement */
    } finally {
      setGeneratingNum(false)
    }
  }, [])

  useEffect(() => {
    if (isEdit) {
      setLoadingEdit(true)
      authFetch(`${API}/devis/${editDevisId}/`)
        .then(r => r.json())
        .then(d => {
          setNumero(d.numero)
          setClientId(String(d.client))
          setStatut(d.statut)
          setObjet(d.objet || '')
          setMetier(d.metier || 'plomberie')
          setChantierAdresse(d.chantier_adresse || '')
          setChantierId(d.chantier || null)
          setOriginalLigneIds(d.lignes.map(l => l.id))
          setLignes(d.lignes.map(l => ({
            description: l.description,
            quantite: String(l.quantite),
            prix_unitaire: String(l.prix_unitaire),
            tva: String(l.tva),
            materiau: l.materiau ? String(l.materiau) : '',
          })))
        })
        .finally(() => { setLoadingEdit(false); setTimeout(() => { loadedRef.current = true }, 100) })
    } else {
      genererNumero().finally(() => { setTimeout(() => { loadedRef.current = true }, 100) })
    }
  }, [editDevisId, isEdit, genererNumero])

  const ajouterLigne = useCallback(() => {
    setLignes(prev => [...prev, { description: '', quantite: 1, prix_unitaire: '', tva: '20', materiau: '' }])
    markDirty()
  }, [markDirty])

  const modifierLigne = useCallback((i, champ, val) => {
    setLignes(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [champ]: val }
      if (champ === 'materiau' && val) {
        const mat = materiaux.find(m => m.id === parseInt(val))
        if (mat) { next[i].description = mat.nom; next[i].prix_unitaire = mat.prix_unitaire }
      }
      return next
    })
    markDirty()
  }, [materiaux, markDirty])

  const supprimerLigne = useCallback((i) => {
    setLignes(prev => prev.filter((_, idx) => idx !== i))
    markDirty()
  }, [markDirty])

  const totalHT  = lignes.reduce((a, l) => a + (parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0), 0)
  const totalTVA = lignes.reduce((a, l) => a + (parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0) * ((parseFloat(l.tva) || 0) / 100), 0)

  const enregistrer = async () => {
    if (!numero.trim())   return setMessage({ type: 'error', text: 'Veuillez renseigner un numéro de devis.' })
    if (!clientId)        return setMessage({ type: 'error', text: 'Veuillez sélectionner un client.' })
    if (!lignes.length)   return setMessage({ type: 'error', text: 'Ajoutez au moins une ligne.' })
    for (const l of lignes) {
      if (!l.description.trim() || !(parseFloat(l.prix_unitaire) > 0))
        return setMessage({ type: 'error', text: 'Chaque ligne doit avoir une description et un prix valide.' })
      if (!(parseFloat(l.quantite) > 0))
        return setMessage({ type: 'error', text: 'La quantité de chaque ligne doit être supérieure à 0.' })
    }

    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      if (isEdit) {
        // Gérer la mise à jour du chantier en mode édition
        let chantierIdEdit = chantierId
        if (!chantierAdresse.trim()) {
          chantierIdEdit = null
        } else if (chantierAdresse.trim() !== (chantierId ? chantierAdresse : '')) {
          // Créer un nouveau chantier si l'adresse a été saisie/modifiée
          const rc = await authFetch(`${API}/chantiers/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client: parseInt(clientId), adresse: chantierAdresse.trim() }),
          })
          if (rc.ok) chantierIdEdit = (await rc.json()).id
        }
        const r = await authFetch(`${API}/devis/${editDevisId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numero: numero.trim(), client: parseInt(clientId), statut, objet, metier, chantier: chantierIdEdit }),
        })
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          return setMessage({ type: 'error', text: err.numero ? 'Ce numéro est déjà utilisé.' : 'Erreur lors de la modification.' })
        }
        await Promise.all(originalLigneIds.map(id =>
          authFetch(`${API}/lignes-devis/${id}/`, { method: 'DELETE' })
        ))
        await Promise.all(lignes.map(l =>
          authFetch(`${API}/lignes-devis/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              devis: editDevisId,
              materiau: l.materiau ? parseInt(l.materiau) : null,
              description: l.description,
              quantite: l.quantite,
              prix_unitaire: l.prix_unitaire,
              tva: l.tva,
            }),
          })
        ))
        onDirtyChange?.(false)
        onSuccess(editDevisId)
      } else {
        let chantierId = null
        if (chantierAdresse.trim()) {
          const r = await authFetch(`${API}/chantiers/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client: parseInt(clientId), adresse: chantierAdresse.trim() }),
          })
          if (r.ok) chantierId = (await r.json()).id
        }

        const r = await authFetch(`${API}/devis/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numero: numero.trim(), client: parseInt(clientId), chantier: chantierId, statut, objet, metier }),
        })

        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          return setMessage({ type: 'error', text: err.numero ? 'Ce numéro est déjà utilisé.' : 'Erreur lors de la création.' })
        }

        const devisCree = await r.json()
        await Promise.all(lignes.map(l =>
          authFetch(`${API}/lignes-devis/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              devis: devisCree.id,
              materiau: l.materiau ? parseInt(l.materiau) : null,
              description: l.description,
              quantite: l.quantite,
              prix_unitaire: l.prix_unitaire,
              tva: l.tva,
            }),
          })
        ))
        onDirtyChange?.(false)
        onSuccess(devisCree.id)
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau. Vérifiez que le serveur est démarré.' })
    } finally {
      setSaving(false)
    }
  }

  if (loadingEdit) return (
    <div className="loading-screen"><div className="spinner" /><span>Chargement du devis…</span></div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Modifier le devis' : 'Nouveau devis'}</h1>
          <p className="page-sub">{isEdit ? `Édition du devis ${numero}` : 'Remplissez le formulaire pour créer un devis'}</p>
        </div>
      </div>

      <div className="form-layout">
        <div className="form-stack">

          {/* Infos générales */}
          <div className="form-section">
            <h2 className="section-title">Informations générales</h2>

            <div className="field-row">
              <div className="field">
                <label className="field-label">Numéro de devis</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    className="field-input"
                    value={numero}
                    onChange={e => { setNumero(e.target.value); markDirty() }}
                    placeholder="DEV-2026-001"
                    style={{ fontFamily: 'var(--ff-mono)', letterSpacing: '0.3px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={genererNumero}
                    disabled={generatingNum}
                    title="Générer le prochain numéro"
                    style={{ flexShrink: 0, padding: '0 0.65rem' }}
                  >
                    <Icon name="refresh" size={14}
                      style={generatingNum ? { animation: 'spin 0.7s linear infinite' } : {}} />
                  </button>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Statut</label>
                <select className="field-select" value={statut} onChange={e => { setStatut(e.target.value); markDirty() }}>
                  <option value="brouillon">Brouillon</option>
                  <option value="envoye">Envoyé</option>
                  <option value="accepte">Accepté</option>
                  <option value="refuse">Refusé</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Métier</label>
                <select className="field-select" value={metier} onChange={e => { setMetier(e.target.value); markDirty() }}>
                  <option value="plomberie">Plomberie &amp; Sanitaire</option>
                  <option value="menuiserie">Menuiserie &amp; Bois</option>
                  <option value="electricite">Électricité</option>
                  <option value="maconnerie">Maçonnerie &amp; Gros œuvre</option>
                  <option value="peinture">Peinture &amp; Revêtements</option>
                  <option value="carrelage">Carrelage &amp; Sols</option>
                  <option value="chauffage">Chauffage &amp; Climatisation</option>
                  <option value="autre">Autre / Multi-métiers</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Client</label>
              <select className="field-select" value={clientId} onChange={e => { setClientId(e.target.value); markDirty() }}>
                <option value="">— Sélectionner un client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="field-label">
                Adresse du chantier <span className="field-optional">(optionnel)</span>
              </label>
              <input
                className="field-input"
                value={chantierAdresse}
                onChange={e => { setChantierAdresse(e.target.value); markDirty() }}
                placeholder="12 rue de la Paix, 75001 Paris"
              />
            </div>

            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">
                Message d'introduction <span className="field-optional">(optionnel)</span>
              </label>
              <textarea
                className="field-input"
                rows={3}
                value={objet}
                onChange={e => { setObjet(e.target.value); markDirty() }}
                placeholder="Suite à notre rendez-vous du …, veuillez trouver ci-joint notre devis pour les travaux de…"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Lignes */}
          <div className="form-section">
            <div className="section-header">
              <h2 className="section-title">Lignes du devis</h2>
              <button className="btn btn-outline btn-sm" onClick={ajouterLigne}>
                <Icon name="plus" size={13} /> Ajouter
              </button>
            </div>

            {lignes.length === 0 ? (
              <div className="lignes-empty">
                <Icon name="file" size={30} />
                <p>Aucune ligne — cliquez sur « Ajouter » pour commencer</p>
              </div>
            ) : (
              <div className="lignes-list">
                {lignes.map((ligne, i) => (
                  <div key={i} className="ligne-card">
                    <div className="ligne-index">{String(i + 1).padStart(2, '0')}</div>
                    <div className="ligne-fields">
                      <select
                        className="field-select"
                        value={ligne.materiau}
                        onChange={e => modifierLigne(i, 'materiau', e.target.value)}
                      >
                        <option value="">— Matériau catalogue (optionnel) —</option>
                        {materiaux.map(m => (
                          <option key={m.id} value={m.id}>{m.nom} — {fmt(m.prix_unitaire)} €/{m.unite}</option>
                        ))}
                      </select>
                      <div className="ligne-row-bottom">
                        <input
                          className="field-input"
                          placeholder="Description de la prestation"
                          value={ligne.description}
                          onChange={e => modifierLigne(i, 'description', e.target.value)}
                        />
                        <input
                          type="number" className="field-input" placeholder="Qté"
                          value={ligne.quantite} min="0" step="0.01"
                          onChange={e => modifierLigne(i, 'quantite', e.target.value)}
                        />
                        <input
                          type="number" className="field-input" placeholder="Prix HT"
                          value={ligne.prix_unitaire} min="0" step="0.01"
                          onChange={e => modifierLigne(i, 'prix_unitaire', e.target.value)}
                        />
                        <select
                          className="field-select" value={ligne.tva}
                          onChange={e => modifierLigne(i, 'tva', e.target.value)}
                        >
                          <option value="20">20%</option>
                          <option value="10">10%</option>
                          <option value="5.5">5.5%</option>
                        </select>
                        <button className="btn btn-danger-ghost" onClick={() => supprimerLigne(i)} title="Supprimer">
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Récapitulatif */}
        <aside className="summary-panel">
          <div className="summary-card">
            <div className="summary-title">Récapitulatif</div>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Total HT</span>
                <span className="summary-val">{fmt(totalHT)} €</span>
              </div>
              <div className="summary-row">
                <span>TVA</span>
                <span className="summary-val">{fmt(totalTVA)} €</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row summary-ttc">
                <span>Total TTC</span>
                <span className="summary-val">{fmt(totalHT + totalTVA)} €</span>
              </div>
            </div>

            {message.text && (
              <div className={`status-msg status-${message.type}`}>
                <Icon name={message.type === 'error' ? 'warning' : 'check'} size={13} />
                {message.text}
              </div>
            )}

            <button className="btn btn-primary btn-full" style={{ marginTop: '1.1rem' }} onClick={enregistrer} disabled={saving}>
              {saving
                ? <><div className="spinner-sm" /> {isEdit ? 'Modification…' : 'Enregistrement…'}</>
                : <><Icon name="check" size={15} /> {isEdit ? 'Sauvegarder les modifications' : 'Enregistrer le devis'}</>
              }
            </button>

            <div className="summary-count">{lignes.length} ligne{lignes.length !== 1 ? 's' : ''}</div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ================================================================
   CATALOGUE MATÉRIAUX
   ================================================================ */
const METIERS_CONFIG = {
  plomberie: {
    label: 'Plomberie & Sanitaire',
    catalogueLabel: 'fournitures',
    categories: [
      { value: 'tuyauterie',   label: 'Tuyauterie',    color: '#2563EB', bg: '#DBEAFE' },
      { value: 'robinetterie', label: 'Robinetterie',  color: '#7C3AED', bg: '#F5F3FF' },
      { value: 'chauffe_eau',  label: 'Chauffe-eau',   color: '#D97706', bg: '#FEF3C7' },
      { value: 'sanitaire',    label: 'Sanitaire',     color: '#16A34A', bg: '#DCFCE7' },
      { value: 'raccord',      label: 'Raccord',       color: '#0891B2', bg: '#ECFEFF' },
      { value: 'autre',        label: 'Autre',         color: '#64748B', bg: '#F1F5F9' },
    ],
  },
  menuiserie: {
    label: 'Menuiserie & Bois',
    catalogueLabel: 'fournitures',
    categories: [
      { value: 'bois_panneaux', label: 'Bois & Panneaux',  color: '#92400E', bg: '#FEF3C7' },
      { value: 'quincaillerie', label: 'Quincaillerie',    color: '#64748B', bg: '#F1F5F9' },
      { value: 'vitrage',       label: 'Vitrage',          color: '#0891B2', bg: '#ECFEFF' },
      { value: 'isolation',     label: 'Isolation',        color: '#16A34A', bg: '#DCFCE7' },
      { value: 'finition',      label: 'Finition',         color: '#7C3AED', bg: '#F5F3FF' },
      { value: 'autre',         label: 'Autre',            color: '#64748B', bg: '#F1F5F9' },
    ],
  },
  electricite: {
    label: 'Électricité',
    catalogueLabel: 'fournitures',
    categories: [
      { value: 'cables',        label: 'Câbles & Fils',    color: '#D97706', bg: '#FEF3C7' },
      { value: 'appareillage',  label: 'Appareillage',     color: '#2563EB', bg: '#DBEAFE' },
      { value: 'eclairage',     label: 'Éclairage',        color: '#7C3AED', bg: '#F5F3FF' },
      { value: 'tableau',       label: 'Tableau élec.',    color: '#DC2626', bg: '#FEE2E2' },
      { value: 'gaines',        label: 'Gaines & Tubes',   color: '#0891B2', bg: '#ECFEFF' },
      { value: 'autre',         label: 'Autre',            color: '#64748B', bg: '#F1F5F9' },
    ],
  },
  maconnerie: {
    label: 'Maçonnerie & Gros œuvre',
    catalogueLabel: 'matériaux',
    categories: [
      { value: 'beton',         label: 'Béton',            color: '#64748B', bg: '#F1F5F9' },
      { value: 'briques',       label: 'Briques & Blocs',  color: '#DC2626', bg: '#FEE2E2' },
      { value: 'mortier',       label: 'Mortier & Enduit', color: '#D97706', bg: '#FEF3C7' },
      { value: 'ferraillage',   label: 'Ferraillage',      color: '#374151', bg: '#F3F4F6' },
      { value: 'etancheite',    label: 'Étanchéité',       color: '#0891B2', bg: '#ECFEFF' },
      { value: 'autre',         label: 'Autre',            color: '#64748B', bg: '#F1F5F9' },
    ],
  },
  peinture: {
    label: 'Peinture & Revêtements',
    catalogueLabel: 'produits',
    categories: [
      { value: 'peinture',         label: 'Peinture',          color: '#2563EB', bg: '#DBEAFE' },
      { value: 'enduit',           label: 'Enduit & Plâtre',   color: '#D97706', bg: '#FEF3C7' },
      { value: 'revetement_mural', label: 'Revêtement mural',  color: '#7C3AED', bg: '#F5F3FF' },
      { value: 'outillage',        label: 'Outillage',         color: '#64748B', bg: '#F1F5F9' },
      { value: 'preparation',      label: 'Préparation',       color: '#16A34A', bg: '#DCFCE7' },
      { value: 'autre',            label: 'Autre',             color: '#64748B', bg: '#F1F5F9' },
    ],
  },
  carrelage: {
    label: 'Carrelage & Sols',
    catalogueLabel: 'fournitures',
    categories: [
      { value: 'carrelage',    label: 'Carrelage & Faïence',  color: '#0891B2', bg: '#ECFEFF' },
      { value: 'colle_joint',  label: 'Colle & Joint',        color: '#D97706', bg: '#FEF3C7' },
      { value: 'profile',      label: 'Profilés & Finitions', color: '#64748B', bg: '#F1F5F9' },
      { value: 'sol_souple',   label: 'Sol souple & Parquet', color: '#16A34A', bg: '#DCFCE7' },
      { value: 'outillage',    label: 'Outillage',            color: '#7C3AED', bg: '#F5F3FF' },
      { value: 'autre',        label: 'Autre',                color: '#64748B', bg: '#F1F5F9' },
    ],
  },
  chauffage: {
    label: 'Chauffage & Climatisation',
    catalogueLabel: 'équipements',
    categories: [
      { value: 'chaudiere',     label: 'Chaudière & PAC',     color: '#DC2626', bg: '#FEE2E2' },
      { value: 'radiateur',     label: 'Radiateurs',          color: '#D97706', bg: '#FEF3C7' },
      { value: 'climatisation', label: 'Climatisation',       color: '#0891B2', bg: '#ECFEFF' },
      { value: 'vmc',           label: 'VMC & Ventilation',   color: '#16A34A', bg: '#DCFCE7' },
      { value: 'tuyauterie',    label: 'Tuyauterie',          color: '#2563EB', bg: '#DBEAFE' },
      { value: 'autre',         label: 'Autre',               color: '#64748B', bg: '#F1F5F9' },
    ],
  },
  autre: {
    label: 'Multi-métiers',
    catalogueLabel: 'articles',
    categories: [
      { value: 'fournitures',    label: 'Fournitures',         color: '#2563EB', bg: '#DBEAFE' },
      { value: 'main_oeuvre',    label: "Main d'œuvre",        color: '#16A34A', bg: '#DCFCE7' },
      { value: 'location',       label: 'Location matériel',   color: '#D97706', bg: '#FEF3C7' },
      { value: 'sous_traitance', label: 'Sous-traitance',      color: '#7C3AED', bg: '#F5F3FF' },
      { value: 'frais',          label: 'Frais divers',        color: '#64748B', bg: '#F1F5F9' },
      { value: 'autre',          label: 'Autre',               color: '#64748B', bg: '#F1F5F9' },
    ],
  },
}

const getCategories = (metier) => METIERS_CONFIG[metier]?.categories ?? METIERS_CONFIG.plomberie.categories

const findCatAnywhere = (value) => {
  for (const m of Object.values(METIERS_CONFIG)) {
    const c = m.categories.find(c => c.value === value)
    if (c) return c
  }
  return { value, label: value, color: '#64748B', bg: '#F1F5F9' }
}

function CatBadge({ categorie }) {
  const cat = findCatAnywhere(categorie)
  return (
    <span style={{
      display: 'inline-block', padding: '0.18rem 0.55rem', borderRadius: 12,
      fontSize: 11.5, fontWeight: 600, background: cat.bg, color: cat.color,
      whiteSpace: 'nowrap',
    }}>
      {cat.label}
    </span>
  )
}

const MATERIAU_VIDE = { nom: '', reference: '', categorie: 'autre', prix_unitaire: '', unite: 'pièce' }

function CatalogueView({ materiaux, setMateriaux, showToast, metier = 'plomberie' }) {
  const categories = getCategories(metier)
  const metierInfo = METIERS_CONFIG[metier] ?? METIERS_CONFIG.plomberie

  const [modal, setModal]                   = useState(null)
  const [form, setForm]                     = useState({ ...MATERIAU_VIDE, categorie: categories[0].value })
  const [errors, setErrors]                 = useState({})
  const [saving, setSaving]                 = useState(false)
  const [confirmDelete, setConfirmDelete]   = useState(null)
  const [deleting, setDeleting]             = useState(false)
  const [search, setSearch]                 = useState('')
  const [filtreCategorie, setFiltreCategorie] = useState('toutes')

  const materiauFiltres = materiaux
    .filter(m => {
      if (filtreCategorie !== 'toutes' && m.categorie !== filtreCategorie) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return m.nom.toLowerCase().includes(q) || (m.reference || '').toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  const set = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const openAdd = () => { setForm({ ...MATERIAU_VIDE, categorie: categories[0].value }); setErrors({}); setModal('add') }
  const openEdit = (m) => {
    setForm({ nom: m.nom, reference: m.reference || '', categorie: m.categorie, prix_unitaire: String(m.prix_unitaire), unite: m.unite })
    setErrors({})
    setModal({ edit: m })
  }

  const validate = () => {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Champ obligatoire'
    if (!form.prix_unitaire || !(parseFloat(form.prix_unitaire) > 0)) e.prix_unitaire = 'Prix invalide'
    if (!form.unite.trim()) e.unite = 'Champ obligatoire'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      const isEdit = modal?.edit
      const method = isEdit ? 'PATCH' : 'POST'
      const url    = isEdit ? `${API}/materiaux/${modal.edit.id}/` : `${API}/materiaux/`
      const r = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error()
      const saved = await r.json()
      setMateriaux(prev => isEdit ? prev.map(m => m.id === saved.id ? saved : m) : [...prev, saved])
      showToast('success', isEdit ? `"${saved.nom}" modifié.` : `"${saved.nom}" ajouté au catalogue.`)
      setModal(null)
    } catch {
      showToast('error', 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const r = await authFetch(`${API}/materiaux/${confirmDelete.id}/`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      setMateriaux(prev => prev.filter(m => m.id !== confirmDelete.id))
      showToast('success', `"${confirmDelete.nom}" supprimé du catalogue.`)
      setConfirmDelete(null)
    } catch {
      showToast('error', 'Impossible de supprimer ce matériau.')
    } finally {
      setDeleting(false)
    }
  }

  const countCat = categories.reduce((acc, cat) => {
    acc[cat.value] = materiaux.filter(m => m.categorie === cat.value).length
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Catalogue — {metierInfo.label}</h1>
          <p className="page-sub">{materiaux.length} {metierInfo.catalogueLabel} en catalogue</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="plus" size={15} /> Ajouter
        </button>
      </div>

      <div className="filter-bar">
        <button className={`filter-pill${filtreCategorie === 'toutes' ? ' active' : ''}`}
          onClick={() => setFiltreCategorie('toutes')}>
          Toutes <span className="filter-count">{materiaux.length}</span>
        </button>
        {categories.map(cat => (
          <button
            key={cat.value}
            className={`filter-pill${filtreCategorie === cat.value ? ' active' : ''}`}
            style={filtreCategorie === cat.value ? { background: cat.color, borderColor: cat.color, color: 'white' } : {}}
            onClick={() => setFiltreCategorie(cat.value)}
          >
            {cat.label} <span className="filter-count">{countCat[cat.value] || 0}</span>
          </button>
        ))}
      </div>

      <div className="search-bar">
        <Icon name="search" size={15} />
        <input
          className="search-input"
          placeholder="Rechercher par désignation ou référence…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={() => setSearch('')}><Icon name="x" size={13} /></button>}
      </div>

      <div className="card">
        {materiauFiltres.length === 0 ? (
          <div className="empty-table">
            <Icon name="package" size={32} />
            <p style={{ marginTop: '0.75rem' }}>
              {search || filtreCategorie !== 'toutes'
                ? 'Aucun matériau ne correspond à votre recherche.'
                : `Catalogue vide — ajoutez vos premières ${metierInfo.catalogueLabel}.`}
            </p>
            {!search && filtreCategorie === 'toutes' && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={openAdd}>
                <Icon name="plus" size={13} /> Ajouter
              </button>
            )}
          </div>
        ) : (
          <table className="devis-table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Référence</th>
                <th>Catégorie</th>
                <th style={{ textAlign: 'right' }}>P.U. HT</th>
                <th>Unité</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {materiauFiltres.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{m.nom}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: '12px', fontFamily: 'var(--ff-mono)' }}>
                    {m.reference || <span style={{ color: 'var(--border-dark)' }}>—</span>}
                  </td>
                  <td><CatBadge categorie={m.categorie} /></td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--ff-mono)', fontWeight: 600, color: 'var(--text)' }}>
                    {fmt(m.prix_unitaire)} €
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: '12.5px' }}>{m.unite}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(m)} title="Modifier">
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="btn btn-danger-ghost" onClick={() => setConfirmDelete(m)} title="Supprimer">
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {materiauFiltres.length > 0 && (
        <div className="list-summary">
          <span>{materiauFiltres.length} article{materiauFiltres.length > 1 ? 's' : ''} affiché{materiauFiltres.length > 1 ? 's' : ''}</span>
          <span style={{ color: 'var(--text-2)', fontSize: '12px' }}>Trié par ordre alphabétique</span>
        </div>
      )}

      {/* Modal ajout / modification */}
      <Modal
        open={!!modal}
        title={modal?.edit ? `Modifier — ${modal.edit.nom}` : `Ajouter — ${metierInfo.catalogueLabel}`}
        onClose={() => setModal(null)}
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Annuler</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner-sm" /> Enregistrement…</> : <><Icon name="check" size={14} /> Enregistrer</>}
            </button>
          </>
        }
      >
        <div className="field">
          <label className="field-label field-required">Désignation</label>
          <input className={`field-input${errors.nom ? ' field-error' : ''}`}
            value={form.nom} onChange={e => set('nom', e.target.value)}
            placeholder="Tube PER 16mm — rouleau 25m" autoFocus />
          {errors.nom && <span className="field-err-msg">{errors.nom}</span>}
        </div>
        <div className="field">
          <label className="field-label">Référence <span className="field-optional">(optionnel)</span></label>
          <input className="field-input" value={form.reference}
            onChange={e => set('reference', e.target.value)}
            placeholder="REF-001" style={{ fontFamily: 'var(--ff-mono)', maxWidth: 200 }} />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field-label">Catégorie</label>
            <select className="field-select" value={form.categorie} onChange={e => set('categorie', e.target.value)}>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label field-required">Unité</label>
            <input className={`field-input${errors.unite ? ' field-error' : ''}`}
              value={form.unite} onChange={e => set('unite', e.target.value)}
              placeholder="pièce" list="unites-list" />
            <datalist id="unites-list">
              {['pièce', 'm', 'm²', 'm³', 'L', 'kg', 'heure', 'forfait', 'lot'].map(u => (
                <option key={u} value={u} />
              ))}
            </datalist>
            {errors.unite && <span className="field-err-msg">{errors.unite}</span>}
          </div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="field-label field-required">Prix unitaire HT (€)</label>
          <input type="number" className={`field-input${errors.prix_unitaire ? ' field-error' : ''}`}
            value={form.prix_unitaire} onChange={e => set('prix_unitaire', e.target.value)}
            placeholder="0.00" min="0" step="0.01"
            style={{ maxWidth: 180, fontFamily: 'var(--ff-mono)' }} />
          {errors.prix_unitaire && <span className="field-err-msg">{errors.prix_unitaire}</span>}
        </div>
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        open={!!confirmDelete}
        title="Supprimer du catalogue"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(null)}>Annuler</button>
            <button className="btn btn-sm" style={{ background: 'var(--error)', color: 'white' }}
              onClick={handleDelete} disabled={deleting}>
              {deleting
                ? <><div className="spinner-sm" style={{ borderTopColor: 'white' }} /> Suppression…</>
                : <><Icon name="trash" size={13} /> Supprimer</>}
            </button>
          </>
        }
      >
        <div className="modal-danger-msg">
          <Icon name="warning" size={16} />
          <div>
            <strong>Supprimer « {confirmDelete?.nom} » ?</strong>
            <span> Ce matériau ne sera plus proposé dans les nouveaux devis. Les lignes existantes ne sont pas affectées.</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ================================================================
   LISTE DEVIS (vue complète avec recherche et filtres)
   ================================================================ */
function DevisListView({ allDevis, loadingDevis, onViewDevis, onEditDevis, onDeleteDevis, onNewDevis, onStatusChange, onDupliquerDevis, clientFiltre = null }) {
  const [search, setSearch]           = useState(clientFiltre ? clientFiltre.nom : '')
  const [filtreStatut, setFiltreStatut] = useState('tous')

  const devisFiltres = allDevis
    .filter(d => {
      if (clientFiltre && d.client !== clientFiltre.id) return false
      if (filtreStatut !== 'tous' && d.statut !== filtreStatut) return false
      if (search.trim() && !clientFiltre) {
        const q = search.toLowerCase()
        return d.numero.toLowerCase().includes(q) || (d.client_nom || '').toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => b.id - a.id)

  const counts = {
    tous:      allDevis.length,
    brouillon: allDevis.filter(d => d.statut === 'brouillon').length,
    envoye:    allDevis.filter(d => d.statut === 'envoye').length,
    accepte:   allDevis.filter(d => d.statut === 'accepte').length,
    refuse:    allDevis.filter(d => d.statut === 'refuse').length,
  }

  const montantFiltres = devisFiltres.reduce((a, d) => a + parseFloat(d.total_ht || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{clientFiltre ? `Devis — ${clientFiltre.nom}` : 'Mes devis'}</h1>
          <p className="page-sub">{devisFiltres.length} devis{clientFiltre ? ` pour ce client` : ' au total'}</p>
        </div>
        <button className="btn btn-primary" onClick={onNewDevis}>
          <Icon name="plus" size={15} /> Créer un devis
        </button>
      </div>

      {/* Filtres par statut */}
      <div className="filter-bar">
        {['tous', 'brouillon', 'envoye', 'accepte', 'refuse'].map(s => (
          <button
            key={s}
            className={`filter-pill${filtreStatut === s ? ' active' : ''}${s !== 'tous' ? ` filter-${s}` : ''}`}
            onClick={() => setFiltreStatut(s)}
          >
            {s === 'tous' ? 'Tous' : STATUT_LABELS[s]}
            <span className="filter-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="search-bar">
        <Icon name="search" size={15} />
        <input
          className="search-input"
          placeholder="Rechercher par numéro ou nom de client…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>
            <Icon name="x" size={13} />
          </button>
        )}
      </div>

      <div className="card">
        {loadingDevis ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}>
            <div className="spinner" />
          </div>
        ) : devisFiltres.length === 0 ? (
          <div className="empty-table">
            <Icon name="file" size={32} />
            <p style={{ marginTop: '0.75rem' }}>
              {search || filtreStatut !== 'tous'
                ? 'Aucun devis ne correspond à votre recherche.'
                : 'Aucun devis pour l\'instant.'}
            </p>
            {!search && filtreStatut === 'tous' && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={onNewDevis}>
                <Icon name="plus" size={13} /> Créer le premier
              </button>
            )}
          </div>
        ) : (
          <table className="devis-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Total HT</th>
                <th style={{ width: '120px' }}></th>
              </tr>
            </thead>
            <tbody>
              {devisFiltres.map(d => (
                <tr key={d.id} onClick={() => onViewDevis(d.id)} style={{ cursor: 'pointer' }}>
                  <td><span className="devis-numero">{d.numero}</span></td>
                  <td style={{ fontWeight: 500 }}>{d.client_nom}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: '12.5px' }}>
                    {new Date(d.date_creation).toLocaleDateString('fr-FR')}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <select
                      className={`status-select status-select-${d.statut}`}
                      value={d.statut}
                      onChange={e => onStatusChange(d, e.target.value)}
                    >
                      <option value="brouillon">Brouillon</option>
                      <option value="envoye">Envoyé</option>
                      <option value="accepte">Accepté</option>
                      <option value="refuse">Refusé</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="devis-amount">{fmt(d.total_ht)} €</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}
                      onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onViewDevis(d.id)} title="Voir">
                        <Icon name="eye" size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => onEditDevis(d)} title="Modifier">
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => onDupliquerDevis(d)} title="Dupliquer">
                        <Icon name="copy" size={14} />
                      </button>
                      <button className="btn btn-danger-ghost" onClick={() => onDeleteDevis(d)} title="Supprimer">
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {devisFiltres.length > 0 && (
        <div className="list-summary">
          <span>{devisFiltres.length} devis affiché{devisFiltres.length > 1 ? 's' : ''}</span>
          <span>Total HT : <strong>{fmt(montantFiltres)} €</strong></span>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   CLIENTS
   ================================================================ */
const CLIENT_VIDE = { nom: '', adresse: '', telephone: '', email: '' }

function ClientsView({ clients, setClients, allDevis, showToast, onVoirDevisClient }) {
  const [modal, setModal]         = useState(null)   // null | 'add' | { edit: client }
  const [form, setForm]           = useState(CLIENT_VIDE)
  const [errors, setErrors]       = useState({})
  const [saving, setSaving]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  const devisParClient = allDevis.reduce((map, d) => {
    map[d.client] = (map[d.client] || 0) + 1
    return map
  }, {})

  const set = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const openAdd = () => {
    setForm(CLIENT_VIDE)
    setErrors({})
    setModal('add')
  }

  const openEdit = (client) => {
    setForm({ nom: client.nom, adresse: client.adresse, telephone: client.telephone || '', email: client.email || '' })
    setErrors({})
    setModal({ edit: client })
  }

  const validate = () => {
    const e = {}
    if (!form.nom.trim())     e.nom     = 'Champ obligatoire'
    if (!form.adresse.trim()) e.adresse = 'Champ obligatoire'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      const isEdit = modal?.edit
      const method = isEdit ? 'PATCH' : 'POST'
      const url    = isEdit ? `${API}/clients/${modal.edit.id}/` : `${API}/clients/`
      const r = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error()
      const saved = await r.json()
      setClients(prev => isEdit ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved])
      showToast('success', isEdit ? `Client "${saved.nom}" modifié.` : `Client "${saved.nom}" ajouté.`)
      setModal(null)
    } catch {
      showToast('error', 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const r = await authFetch(`${API}/clients/${confirmDelete.id}/`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      setClients(prev => prev.filter(c => c.id !== confirmDelete.id))
      showToast('success', `Client "${confirmDelete.nom}" supprimé.`)
      setConfirmDelete(null)
    } catch {
      showToast('error', 'Impossible de supprimer ce client.')
    } finally {
      setDeleting(false)
    }
  }

  const nbDevisClient = confirmDelete ? (devisParClient[confirmDelete.id] || 0) : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-sub">{clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="plus" size={15} /> Ajouter un client
        </button>
      </div>

      <div className="card">
        {clients.length === 0 ? (
          <div className="empty-table">
            <Icon name="users" size={36} />
            <p style={{ marginTop: '0.75rem' }}>Aucun client — commencez par en ajouter un.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={openAdd}>
              <Icon name="plus" size={13} /> Ajouter un client
            </button>
          </div>
        ) : (
          <table className="devis-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Adresse</th>
                <th>Contact</th>
                <th>Devis</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} onClick={() => onVoirDevisClient && onVoirDevisClient(c)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{c.nom}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: '12.5px', maxWidth: 220 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.adresse}
                    </span>
                  </td>
                  <td style={{ fontSize: '12.5px' }}>
                    {c.telephone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-2)' }}>
                        <Icon name="phone" size={12} /> {c.telephone}
                      </div>
                    )}
                    {c.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-2)', marginTop: c.telephone ? '0.2rem' : 0 }}>
                        <Icon name="mail" size={12} /> {c.email}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`stat-chip ${devisParClient[c.id] ? 'primary' : ''}`}
                      style={!devisParClient[c.id] ? { background: 'var(--bg)', color: 'var(--text-2)' } : {}}>
                      {devisParClient[c.id] || 0} devis
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="Modifier">
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="btn btn-danger-ghost" onClick={() => setConfirmDelete(c)} title="Supprimer">
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal ajout / modification */}
      <Modal
        open={!!modal}
        title={modal?.edit ? `Modifier — ${modal.edit.nom}` : 'Nouveau client'}
        onClose={() => setModal(null)}
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Annuler</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner-sm" /> Enregistrement…</> : <><Icon name="check" size={14} /> Enregistrer</>}
            </button>
          </>
        }
      >
        <div className="field">
          <label className="field-label field-required">Nom du client</label>
          <input className={`field-input${errors.nom ? ' field-error' : ''}`}
            value={form.nom} onChange={e => set('nom', e.target.value)}
            placeholder="Martin Entreprise" autoFocus />
          {errors.nom && <span className="field-err-msg">{errors.nom}</span>}
        </div>
        <div className="field">
          <label className="field-label field-required">Adresse</label>
          <textarea className={`field-input${errors.adresse ? ' field-error' : ''}`}
            value={form.adresse} onChange={e => set('adresse', e.target.value)}
            placeholder="15 avenue de la République, 75011 Paris"
            rows={2} style={{ resize: 'vertical' }} />
          {errors.adresse && <span className="field-err-msg">{errors.adresse}</span>}
        </div>
        <div className="field-row" style={{ marginBottom: 0 }}>
          <div className="field">
            <label className="field-label">Téléphone <span className="field-optional">(optionnel)</span></label>
            <input className="field-input" value={form.telephone}
              onChange={e => set('telephone', e.target.value)} placeholder="06 12 34 56 78" />
          </div>
          <div className="field">
            <label className="field-label">Email <span className="field-optional">(optionnel)</span></label>
            <input type="email" className="field-input" value={form.email}
              onChange={e => set('email', e.target.value)} placeholder="contact@client.fr" />
          </div>
        </div>
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        open={!!confirmDelete}
        title="Supprimer le client"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(null)}>Annuler</button>
            <button className="btn btn-sm" style={{ background: 'var(--error)', color: 'white' }}
              onClick={handleDelete} disabled={deleting}>
              {deleting ? <><div className="spinner-sm" style={{ borderTopColor: 'white' }} /> Suppression…</> : <><Icon name="trash" size={13} /> Supprimer</>}
            </button>
          </>
        }
      >
        <div className="modal-danger-msg">
          <Icon name="warning" size={16} />
          <div>
            <strong>Cette action est irréversible.</strong>
            {nbDevisClient > 0
              ? ` Supprimer "${confirmDelete?.nom}" supprimera également ${nbDevisClient} devis associé${nbDevisClient > 1 ? 's' : ''}.`
              : ` Le client "${confirmDelete?.nom}" sera définitivement supprimé.`
            }
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ================================================================
   PROFIL ARTISAN
   ================================================================ */
const PROFIL_VIDE = {
  nom_entreprise: '', siret: '', tva_intracommunautaire: '',
  adresse: '', telephone: '', email: '',
  assurance_nom: '', assurance_police_numero: '', assurance_zone_couverture: '',
  validite_devis_jours: 30, mentions_paiement: '', metier: 'plomberie',
}

function ProfilArtisanView({ onToast }) {
  const [profil, setProfil]   = useState(null)
  const [form, setForm]       = useState(PROFIL_VIDE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [errors, setErrors]   = useState({})

  useEffect(() => {
    authFetch(`${API}/artisan-profil/`)
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) { setProfil(data[0]); setForm(data[0]) }
      })
      .finally(() => setLoading(false))
  }, [])

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.nom_entreprise.trim()) e.nom_entreprise = 'Champ obligatoire'
    if (!form.siret.trim())          e.siret = 'Champ obligatoire'
    if (form.siret && form.siret.replace(/\s/g, '').length !== 14)
      e.siret = 'Le SIRET doit contenir 14 chiffres'
    if (!form.adresse.trim())        e.adresse = 'Champ obligatoire'
    if (!form.assurance_nom.trim())  e.assurance_nom = 'Champ obligatoire'
    if (!form.assurance_police_numero.trim()) e.assurance_police_numero = 'Champ obligatoire'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      const method = profil ? 'PATCH' : 'POST'
      const url    = profil ? `${API}/artisan-profil/${profil.id}/` : `${API}/artisan-profil/`
      const r = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error()
      const saved = await r.json()
      setProfil(saved)
      setForm(saved)
      onToast('success', 'Profil artisan enregistré avec succès.')
    } catch {
      onToast('error', 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const requis = ['nom_entreprise', 'siret', 'adresse', 'assurance_nom', 'assurance_police_numero']
  const isComplete = profil && requis.every(f => profil[f]?.trim())

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profil artisan</h1>
          <p className="page-sub">Mentions légales obligatoires sur chaque devis</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><div className="spinner-sm" /> Enregistrement…</> : <><Icon name="check" size={15} /> Enregistrer</>}
        </button>
      </div>

      {profil && (
        <div className={`profil-status ${isComplete ? 'complete' : 'incomplete'}`}>
          <Icon name={isComplete ? 'check' : 'warning'} size={14} />
          {isComplete
            ? 'Profil complet — toutes les mentions légales sont renseignées.'
            : 'Profil incomplet — certains champs obligatoires manquent.'}
        </div>
      )}

      <div className="form-stack">
        {/* Entreprise */}
        <div className="form-section">
          <h2 className="section-title">Informations entreprise</h2>

          <div className="field-row">
            <div className="field">
              <label className="field-label field-required">Nom de l'entreprise</label>
              <input className={`field-input${errors.nom_entreprise ? ' field-error' : ''}`}
                value={form.nom_entreprise} onChange={e => set('nom_entreprise', e.target.value)}
                placeholder="Plomberie Dupont SARL" />
              {errors.nom_entreprise && <span className="field-err-msg">{errors.nom_entreprise}</span>}
            </div>
            <div className="field">
              <label className="field-label field-required">SIRET (14 chiffres)</label>
              <input className={`field-input${errors.siret ? ' field-error' : ''}`}
                value={form.siret} onChange={e => set('siret', e.target.value)}
                placeholder="12345678901234" maxLength={14} />
              {errors.siret && <span className="field-err-msg">{errors.siret}</span>}
            </div>
          </div>

          <div className="field">
            <label className="field-label field-required">Adresse complète</label>
            <textarea className={`field-input${errors.adresse ? ' field-error' : ''}`}
              value={form.adresse} onChange={e => set('adresse', e.target.value)}
              placeholder="12 rue des Artisans, 75001 Paris"
              rows={2} style={{ resize: 'vertical' }} />
            {errors.adresse && <span className="field-err-msg">{errors.adresse}</span>}
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label">Téléphone <span className="field-optional">(optionnel)</span></label>
              <input className="field-input" value={form.telephone} onChange={e => set('telephone', e.target.value)}
                placeholder="01 23 45 67 89" />
            </div>
            <div className="field">
              <label className="field-label">Email <span className="field-optional">(optionnel)</span></label>
              <input type="email" className="field-input" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="contact@plomberie-dupont.fr" />
            </div>
          </div>

          <div className="field">
            <label className="field-label">N° TVA intracommunautaire <span className="field-optional">(optionnel)</span></label>
            <input className="field-input" value={form.tva_intracommunautaire}
              onChange={e => set('tva_intracommunautaire', e.target.value)}
              placeholder="FR12345678901" style={{ maxWidth: 240 }} />
          </div>
        </div>

        {/* Métier */}
        <div className="form-section">
          <h2 className="section-title">Secteur d'activité</h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: '1rem', marginTop: '-0.5rem' }}>
            Adapte le catalogue de fournitures et les catégories à votre métier.
          </p>
          <div className="field" style={{ maxWidth: 320 }}>
            <label className="field-label">Métier principal</label>
            <select className="field-select" value={form.metier} onChange={e => set('metier', e.target.value)}>
              {Object.entries(METIERS_CONFIG).map(([key, m]) => (
                <option key={key} value={key}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assurance décennale */}
        <div className="form-section">
          <h2 className="section-title">Assurance décennale</h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: '1rem', marginTop: '-0.5rem' }}>
            Obligatoire pour les travaux de construction — apparaît sur chaque devis.
          </p>

          <div className="field-row">
            <div className="field">
              <label className="field-label field-required">Nom de l'assureur</label>
              <input className={`field-input${errors.assurance_nom ? ' field-error' : ''}`}
                value={form.assurance_nom} onChange={e => set('assurance_nom', e.target.value)}
                placeholder="AXA Assurances" />
              {errors.assurance_nom && <span className="field-err-msg">{errors.assurance_nom}</span>}
            </div>
            <div className="field">
              <label className="field-label field-required">Numéro de police</label>
              <input className={`field-input${errors.assurance_police_numero ? ' field-error' : ''}`}
                value={form.assurance_police_numero} onChange={e => set('assurance_police_numero', e.target.value)}
                placeholder="AXA-2026-000123" />
              {errors.assurance_police_numero && <span className="field-err-msg">{errors.assurance_police_numero}</span>}
            </div>
          </div>

          <div className="field">
            <label className="field-label">Zone de couverture <span className="field-optional">(optionnel)</span></label>
            <input className="field-input" value={form.assurance_zone_couverture}
              onChange={e => set('assurance_zone_couverture', e.target.value)}
              placeholder="Île-de-France" style={{ maxWidth: 280 }} />
          </div>
        </div>

        {/* Conditions de paiement */}
        <div className="form-section">
          <h2 className="section-title">Conditions du devis</h2>
          <div className="field-row">
            <div className="field">
              <label className="field-label">Validité du devis (jours)</label>
              <input type="number" className="field-input" value={form.validite_devis_jours}
                onChange={e => set('validite_devis_jours', parseInt(e.target.value) || 30)}
                min="1" max="365" style={{ maxWidth: 120, fontFamily: 'var(--ff-mono)' }} />
            </div>
          </div>
          <div className="field">
            <label className="field-label">Conditions de paiement <span className="field-optional">(optionnel)</span></label>
            <textarea className="field-input" value={form.mentions_paiement}
              onChange={e => set('mentions_paiement', e.target.value)}
              placeholder="Ex : Acompte de 30 % à la commande. Solde à réception des travaux. Paiement par virement bancaire."
              rows={3} style={{ resize: 'vertical' }} />
          </div>
        </div>

        {/* Aperçu */}
        {(form.nom_entreprise || form.siret) && (
          <div className="form-section">
            <h2 className="section-title">Aperçu sur le devis</h2>
            <div style={{ fontSize: 12.5, color: '#5A6475', lineHeight: 1.8, fontFamily: 'var(--ff-body)' }}>
              {form.nom_entreprise && <div style={{ fontWeight: 700, fontSize: 14, color: '#1E252F', marginBottom: 4 }}>{form.nom_entreprise}</div>}
              {form.adresse && <div>{form.adresse}</div>}
              {form.siret && <div>SIRET : {form.siret}{form.tva_intracommunautaire && ` — TVA intra : ${form.tva_intracommunautaire}`}</div>}
              {form.telephone && <div>Tél : {form.telephone}{form.email && ` — ${form.email}`}</div>}
              {form.assurance_nom && (
                <div style={{ fontStyle: 'italic', marginTop: 4 }}>
                  Assurance décennale : {form.assurance_nom}, police n° {form.assurance_police_numero}
                  {form.assurance_zone_couverture && ` (${form.assurance_zone_couverture})`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   APP SHELL
   ================================================================ */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('df_access'))
  const [clients, setClients]     = useState([])
  const [materiaux, setMateriaux] = useState([])
  const [allDevis, setAllDevis]   = useState([])
  const [artisan, setArtisan]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [loadingDevis, setLoadingDevis] = useState(true)
  const [apiError, setApiError]   = useState(null)
  const [activeView, setActiveView] = useState('dashboard')
  const [devisAffiche, setDevisAffiche] = useState(null)
  const [clientFiltre, setClientFiltre] = useState(null)
  const [toasts, setToasts]       = useState([])
  const [editDevisId, setEditDevisId]           = useState(null)
  const [confirmDeleteDevis, setConfirmDeleteDevis] = useState(null)
  const [deletingDevis, setDeletingDevis]       = useState(false)
  const [sidebarOpen, setSidebarOpen]           = useState(false)
  const [metierPrefill, setMetierPrefill]       = useState('plomberie')
  const [devisFormDirty, setDevisFormDirty]     = useState(false)
  const [pendingNavTarget, setPendingNavTarget] = useState(null)

  const showToast = useCallback((type, text) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, text }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const closeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  /* Chargement initial */
  useEffect(() => {
    if (!isLoggedIn) return
    Promise.all([
      authFetch(`${API}/clients/`).then(r => { if (!r.ok) throw new Error(); return r.json() }),
      authFetch(`${API}/materiaux/`).then(r => { if (!r.ok) throw new Error(); return r.json() }),
      authFetch(`${API}/artisan-profil/`).then(r => r.json()).catch(() => []),
    ])
      .then(([c, m, a]) => { setClients(c); setMateriaux(m); setArtisan(a[0] ?? null) })
      .catch(() => setApiError('Impossible de contacter le serveur. Vérifiez que le backend Django est démarré sur le port 8000.'))
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  /* Chargement des devis pour le dashboard */
  const fetchDevis = useCallback(() => {
    if (!isLoggedIn) return
    setLoadingDevis(true)
    authFetch(`${API}/devis/`)
      .then(r => r.json())
      .then(setAllDevis)
      .catch(() => {})
      .finally(() => setLoadingDevis(false))
  }, [isLoggedIn])

  useEffect(() => { fetchDevis() }, [fetchDevis])

  const handleDevisSuccess = (id) => {
    fetchDevis()
    setEditDevisId(null)
    setDevisFormDirty(false)
    setDevisAffiche(id)
  }

  const handleEditDevis = useCallback((devis) => {
    setEditDevisId(devis.id)
    setActiveView('nouveau-devis')
  }, [])

  const handleDupliquerDevis = useCallback(async (devis) => {
    try {
      const [fullDevis, numData] = await Promise.all([
        authFetch(`${API}/devis/${devis.id}/`).then(r => r.json()),
        authFetch(`${API}/generate-numero/`).then(r => r.json()),
      ])
      const r = await authFetch(`${API}/devis/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: numData.numero, client: fullDevis.client, chantier: fullDevis.chantier, statut: 'brouillon', objet: fullDevis.objet || '' }),
      })
      if (!r.ok) throw new Error()
      const newDevis = await r.json()
      await Promise.all(fullDevis.lignes.map(l =>
        authFetch(`${API}/lignes-devis/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ devis: newDevis.id, materiau: l.materiau, description: l.description, quantite: l.quantite, prix_unitaire: l.prix_unitaire, tva: l.tva }),
        })
      ))
      fetchDevis()
      showToast('success', `Devis dupliqué → ${numData.numero}`)
    } catch {
      showToast('error', 'Erreur lors de la duplication.')
    }
  }, [fetchDevis, showToast])

  const handleStatusChange = useCallback(async (devis, newStatut) => {
    try {
      const r = await authFetch(`${API}/devis/${devis.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      })
      if (!r.ok) throw new Error()
      setAllDevis(prev => prev.map(d => d.id === devis.id ? { ...d, statut: newStatut } : d))
      showToast('success', `Statut mis à jour : "${STATUT_LABELS[newStatut]}"`)
    } catch {
      showToast('error', 'Impossible de modifier le statut.')
    }
  }, [showToast])

  const handleDeleteDevis = async () => {
    if (!confirmDeleteDevis) return
    setDeletingDevis(true)
    try {
      const r = await authFetch(`${API}/devis/${confirmDeleteDevis.id}/`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      fetchDevis()
      showToast('success', `Devis "${confirmDeleteDevis.numero}" supprimé.`)
      setConfirmDeleteDevis(null)
    } catch {
      showToast('error', 'Impossible de supprimer ce devis.')
    } finally {
      setDeletingDevis(false)
    }
  }

  /* Guards */
  if (!isLoggedIn) return <LoginScreen onLogin={() => { setLoading(true); setIsLoggedIn(true) }} />

  if (devisAffiche !== null) {
    return <DevisDocument devisId={devisAffiche} onRetour={() => setDevisAffiche(null)} showToast={showToast} />
  }

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" /><span>Chargement…</span>
    </div>
  )

  if (apiError) return (
    <div className="error-screen">
      <Icon name="warning" size={40} />
      <p>{apiError}</p>
      <button className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => window.location.reload()}>
        Réessayer
      </button>
    </div>
  )

  const navItems = [
    { id: 'dashboard',     label: 'Dashboard',      icon: 'home',     badge: null },
    { id: 'devis',         label: 'Mes devis',       icon: 'list',     badge: allDevis.length || null },
    { id: 'nouveau-devis', label: 'Nouveau devis',   icon: 'fileText', badge: null },
    { id: 'clients',       label: 'Clients',         icon: 'users',    badge: clients.length || null },
    { id: 'catalogue',     label: 'Catalogue',       icon: 'package',  badge: materiaux.length || null },
    { id: 'parametres',    label: 'Profil artisan',  icon: 'settings', badge: !artisan ? '!' : null },
  ]

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-logo">
          <div className="logo-icon">
            <Icon name="spark" size={16} />
          </div>
          <span className="logo-name">DevisFlash</span>
        </div>
        <div className="header-right">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} title="Menu">
            <Icon name="menu" size={20} />
          </button>
          <button className="icon-btn" title="Notifications"><Icon name="bell" size={18} /></button>
          <button className="avatar-btn" title="Déconnexion" onClick={() => {
            localStorage.removeItem('df_access')
            localStorage.removeItem('df_refresh')
            setIsLoggedIn(false)
          }}><Icon name="user" size={15} /></button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`app-sidebar${sidebarOpen ? ' mobile-open' : ''}`}>
        <span className="nav-label">Menu</span>

        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (item.disabled) return
              if (activeView === 'nouveau-devis' && devisFormDirty && item.id !== 'nouveau-devis') {
                setPendingNavTarget(item.id); setSidebarOpen(false); return
              }
              if (item.id !== 'nouveau-devis') setEditDevisId(null)
              setClientFiltre(null)
              setActiveView(item.id); setSidebarOpen(false)
            }}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
            {item.badge != null && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </button>
        ))}

        <span className="nav-label" style={{ marginTop: '1.5rem' }}>Devis par métier</span>
        {[
          { key: 'plomberie',   short: 'Plomberie',    color: '#2563EB' },
          { key: 'electricite', short: 'Électricité',  color: '#D97706' },
          { key: 'menuiserie',  short: 'Menuiserie',   color: '#92400E' },
          { key: 'maconnerie',  short: 'Maçonnerie',   color: '#64748B' },
          { key: 'peinture',    short: 'Peinture',     color: '#7C3AED' },
          { key: 'carrelage',   short: 'Carrelage',    color: '#0891B2' },
          { key: 'chauffage',   short: 'Chauffage',    color: '#DC2626' },
          { key: 'autre',       short: 'Multi-métiers',color: '#16A34A' },
        ].map(m => (
          <button
            key={m.key}
            className="nav-item nav-metier"
            style={{ '--metier-color': m.color }}
            onClick={() => {
              if (activeView === 'nouveau-devis' && devisFormDirty) {
                setPendingNavTarget('nouveau-devis'); setSidebarOpen(false); return
              }
              setEditDevisId(null)
              setMetierPrefill(m.key)
              setActiveView('nouveau-devis')
              setSidebarOpen(false)
            }}
          >
            <span className="metier-dot" />
            {m.short}
          </button>
        ))}

        <div className="sidebar-footer">
          DevisFlash v1.0
        </div>
      </aside>

      {/* Main content */}
      <main className="app-content">
        {activeView === 'dashboard' && (
          <Dashboard
            allDevis={allDevis}
            loadingDevis={loadingDevis}
            artisan={artisan}
            onViewDevis={setDevisAffiche}
            onNewDevis={() => setActiveView('nouveau-devis')}
            onConfigureProfil={() => setActiveView('parametres')}
            onEditDevis={handleEditDevis}
            onDeleteDevis={setConfirmDeleteDevis}
            onDupliquerDevis={handleDupliquerDevis}
          />
        )}
        {activeView === 'devis' && (
          <DevisListView
            allDevis={allDevis}
            loadingDevis={loadingDevis}
            onViewDevis={setDevisAffiche}
            onEditDevis={handleEditDevis}
            onDeleteDevis={setConfirmDeleteDevis}
            onNewDevis={() => setActiveView('nouveau-devis')}
            onStatusChange={handleStatusChange}
            onDupliquerDevis={handleDupliquerDevis}
            clientFiltre={clientFiltre}
          />
        )}
        {activeView === 'nouveau-devis' && (
          <NouveauDevisView
            key={`${editDevisId ?? 'new'}-${metierPrefill}`}
            clients={clients}
            materiaux={materiaux}
            onSuccess={handleDevisSuccess}
            editDevisId={editDevisId}
            onDirtyChange={setDevisFormDirty}
            metierPrefill={metierPrefill}
          />
        )}
        {activeView === 'clients' && (
          <ClientsView
            clients={clients}
            setClients={setClients}
            allDevis={allDevis}
            showToast={showToast}
            onVoirDevisClient={c => { setClientFiltre(c); setActiveView('devis') }}
          />
        )}
        {activeView === 'catalogue' && (
          <CatalogueView
            materiaux={materiaux}
            setMateriaux={setMateriaux}
            showToast={showToast}
            metier={artisan?.metier ?? 'plomberie'}
          />
        )}
        {activeView === 'parametres' && (
          <ProfilArtisanView
            onToast={(type, text) => {
              showToast(type, text)
              if (type === 'success') {
                authFetch(`${API}/artisan-profil/`).then(r => r.json()).then(a => setArtisan(a[0] ?? null))
              }
            }}
          />
        )}
      </main>

      <Toast toasts={toasts} onClose={closeToast} />

      <Modal
        open={!!confirmDeleteDevis}
        title="Supprimer le devis"
        onClose={() => setConfirmDeleteDevis(null)}
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setConfirmDeleteDevis(null)}>Annuler</button>
            <button className="btn btn-sm" style={{ background: 'var(--error)', color: 'white' }}
              onClick={handleDeleteDevis} disabled={deletingDevis}>
              {deletingDevis
                ? <><div className="spinner-sm" style={{ borderTopColor: 'white' }} /> Suppression…</>
                : <><Icon name="trash" size={13} /> Supprimer</>}
            </button>
          </>
        }
      >
        <div className="modal-danger-msg">
          <Icon name="warning" size={16} />
          <div>
            <strong>Cette action est irréversible.</strong>
            {` Le devis "${confirmDeleteDevis?.numero}" et toutes ses lignes seront définitivement supprimés.`}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!pendingNavTarget}
        title="Modifications non sauvegardées"
        onClose={() => setPendingNavTarget(null)}
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setPendingNavTarget(null)}>
              Rester sur le formulaire
            </button>
            <button className="btn btn-sm" style={{ background: 'var(--error)', color: 'white' }}
              onClick={() => {
                setEditDevisId(null)
                setDevisFormDirty(false)
                setActiveView(pendingNavTarget)
                setPendingNavTarget(null)
              }}>
              <Icon name="warning" size={13} /> Quitter sans sauvegarder
            </button>
          </>
        }
      >
        <div className="modal-danger-msg">
          <Icon name="warning" size={16} />
          <div>
            <strong>Votre devis en cours n'est pas enregistré.</strong>
            <span> Si vous quittez maintenant, toutes vos modifications seront perdues.</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
