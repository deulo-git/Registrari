import { useCallback, useEffect, useState } from 'react'
import { I18nProvider, useI18n } from './lib/i18n'
import { AuthProvider, useAuth } from './lib/auth'
import { Onboarding, SignIn } from './screens/Auth'
import { ConfigProvider } from './lib/data'
import { startOfDay } from './lib/format'
import type { Entry, EntryType } from './lib/types'
import { Today } from './screens/Today'
import { Calendar } from './screens/Calendar'
import { Documents } from './screens/Documents'
import { Settings } from './screens/Settings'
import { Appointments } from './screens/Appointments'
import { EntrySheet } from './components/EntrySheet'
import { ToastHost } from './components/Toast'
import { ConfirmHost } from './components/Confirm'
import { Splash } from './components/Splash'
import { onDataChange } from './lib/api'
import { preloadSuggestions, resetSuggestions } from './lib/suggestions'
import { FolderIcon, HomeIcon, TimelineIcon, TypeIcon } from './components/Icons'

type Tab = 'today' | 'calendar' | 'documents' | 'appointments' | 'settings'

function Shell() {
  const { t } = useI18n()
  const { can } = useAuth()
  const [tab, setTab] = useState<Tab>('today')
  /** Settings is no longer a tab: it opens from the gear and goes back to where it came from. */
  const [from, setFrom] = useState<Tab>('today')
  const openSettings = () => { setFrom(tab); setTab('settings') }
  const [day, setDay] = useState(() => startOfDay(new Date()))
  const [sheet, setSheet] = useState<{ type: EntryType; entry?: Entry; date: Date } | null>(null)

  // Suggestions are ready before any form opens (and again after each save).
  useEffect(() => {
    resetSuggestions()
    preloadSuggestions()
    return onDataChange(() => window.setTimeout(preloadSuggestions, 0))
  }, [])

  const add = useCallback((type: EntryType, date = day) => setSheet({ type, date }), [day])
  const edit = useCallback((entry: Entry) => setSheet({ type: entry.type, entry, date: new Date(entry.occurred_at) }), [])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: t('today'), icon: <HomeIcon size={22} /> },
    { id: 'calendar', label: t('timeline'), icon: <TimelineIcon size={22} /> },
    { id: 'documents', label: t('documents'), icon: <FolderIcon size={22} /> },
    { id: 'appointments', label: t('appointments'), icon: <TypeIcon type="appointment" size={22} /> },
  ]

  return (
    <div className={'app' + (tab === 'today' ? ' on-today' : '')}>
      <main>
        <div className="tab-today" hidden={tab !== 'today'}>
          <Today active={tab === 'today'} day={day} setDay={setDay} onAdd={can.write ? (ty) => add(ty) : undefined}
            onOpenCalendar={(d) => { setDay(startOfDay(d)); setTab('calendar') }} />
        </div>
        {tab === 'calendar' && (
          <Calendar initialDay={day} onEdit={edit} onSettings={openSettings} onOpenDay={(d) => { setDay(startOfDay(d)); setTab('today') }} />
        )}
        {tab === 'documents' && <Documents onAdd={can.write ? () => add('document', startOfDay(new Date())) : undefined} onEdit={edit} onSettings={openSettings} />}
        {tab === 'appointments' && <Appointments onAdd={can.write ? () => add('appointment', startOfDay(new Date())) : undefined} onEdit={edit} onSettings={openSettings} />}
        {tab === 'settings' && <Settings onBack={() => setTab(from)} />}
      </main>

      <nav className="tabbar">
        {tabs.map((x) => (
          <button key={x.id} type="button" className={tab === x.id ? 'on' : ''} aria-current={tab === x.id ? 'page' : undefined} onClick={() => {
            if (x.id === 'today' && tab === 'today') setDay(startOfDay(new Date()))
            setTab(x.id)
          }}>
            {x.icon}<span>{x.label}</span>
          </button>
        ))}
      </nav>

      {sheet && (
        <EntrySheet key={sheet.entry?.id ?? sheet.type} type={sheet.type} entry={sheet.entry}
          defaultDate={sheet.date} onClose={() => setSheet(null)} />
      )}
      <Splash />
    </div>
  )
}

function Gate() {
  const { status, active } = useAuth()
  if (status === 'loading') return <div className="auth-screen"><span className="splash-dots"><i /><i /><i /></span></div>
  if (status === 'signedOut') return <SignIn />
  if (status === 'needsProfile') return <Onboarding />
  // Another person's data on screen = a fresh start (state, suggestions, filters).
  return <ConfigProvider><Shell key={active?.ownerId} /></ConfigProvider>
}

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Gate />
        <ToastHost />
        <ConfirmHost />
      </AuthProvider>
    </I18nProvider>
  )
}
