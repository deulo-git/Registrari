import { useCallback, useEffect, useState } from 'react'
import { I18nProvider, useI18n } from './lib/i18n'
import { PinProvider } from './lib/pin'
import { ConfigProvider } from './lib/data'
import { startOfDay } from './lib/format'
import type { Entry, EntryType } from './lib/types'
import { Today } from './screens/Today'
import { Calendar } from './screens/Calendar'
import { Documents } from './screens/Documents'
import { Settings } from './screens/Settings'
import { EntrySheet } from './components/EntrySheet'
import { ToastHost } from './components/Toast'
import { ConfirmHost } from './components/Confirm'
import { Splash } from './components/Splash'
import { onDataChange } from './lib/api'
import { preloadSuggestions } from './lib/suggestions'
import { CalendarIcon, FolderIcon, HomeIcon, SettingsIcon } from './components/Icons'

type Tab = 'today' | 'calendar' | 'documents' | 'settings'

function Shell() {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('today')
  const [day, setDay] = useState(() => startOfDay(new Date()))
  const [sheet, setSheet] = useState<{ type: EntryType; entry?: Entry; date: Date } | null>(null)

  // Suggestions are ready before any form opens (and again after each save).
  useEffect(() => {
    preloadSuggestions()
    return onDataChange(() => window.setTimeout(preloadSuggestions, 0))
  }, [])

  const add = useCallback((type: EntryType, date = day) => setSheet({ type, date }), [day])
  const edit = useCallback((entry: Entry) => setSheet({ type: entry.type, entry, date: new Date(entry.occurred_at) }), [])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: t('today'), icon: <HomeIcon size={22} /> },
    { id: 'calendar', label: t('calendar'), icon: <CalendarIcon size={22} /> },
    { id: 'documents', label: t('documents'), icon: <FolderIcon size={22} /> },
    { id: 'settings', label: t('settings'), icon: <SettingsIcon size={22} /> },
  ]

  return (
    <div className={'app' + (tab === 'today' ? ' on-today' : '')}>
      <header className="topbar">
        <span className="brand"><span className="brand-mark" />{t('appName')}</span>
      </header>

      <main>
        <div className="tab-today" hidden={tab !== 'today'}>
          <Today active={tab === 'today'} day={day} setDay={setDay} onAdd={(ty) => add(ty)}
            onOpenCalendar={() => setTab('calendar')} />
        </div>
        {tab === 'calendar' && (
          <Calendar initialDay={day} onEdit={edit} onOpenDay={(d) => { setDay(startOfDay(d)); setTab('today') }} />
        )}
        {tab === 'documents' && <Documents onAdd={() => add('document', startOfDay(new Date()))} onEdit={edit} />}
        {tab === 'settings' && <Settings />}
      </main>

      <nav className="tabbar">
        {tabs.map((x) => (
          <button key={x.id} type="button" className={tab === x.id ? 'on' : ''} onClick={() => {
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
      <ToastHost />
      <ConfirmHost />
    </div>
  )
}

export function App() {
  return (
    <I18nProvider>
      <PinProvider>
        <ConfigProvider>
          <Shell />
        </ConfigProvider>
      </PinProvider>
    </I18nProvider>
  )
}
