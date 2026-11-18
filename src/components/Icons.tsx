import type { EntryType } from '../lib/types'

type P = { size?: number; color?: string; strokeWidth?: number }

function Svg({ size = 24, color = 'currentColor', strokeWidth = 2, children }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const paths: Record<EntryType, React.ReactNode> = {
  water: <path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z" />,
  meal: (
    <>
      <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" />
      <path d="M17 3c-1.7 0-3 2.2-3 5s1.3 4 3 4v9" />
    </>
  ),
  symptom: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  bowel: (
    <>
      <path d="M8 9c0-2.5 1.8-4.5 4-4.5" />
      <path d="M6.5 13c0-2 1.6-3.5 3.5-3.5h4c1.9 0 3.5 1.5 3.5 3.5" />
      <path d="M4 18c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v1H4z" />
    </>
  ),
  gas: (
    <>
      <path d="M3 8h10a3 3 0 1 0-3-3" />
      <path d="M3 12h15a3 3 0 1 1-3 3" />
      <path d="M3 16h7" />
    </>
  ),
  medication: (
    <>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="M9.5 9.5l5 5" />
    </>
  ),
  appointment: (
    <>
      <path d="M6 3v5a4 4 0 0 0 8 0V3" />
      <path d="M10 12v3a5 5 0 0 0 10 0v-2" />
      <circle cx="20" cy="11" r="2" />
    </>
  ),
  document: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
}

export function TypeIcon({ type, ...p }: P & { type: EntryType }) {
  return <Svg {...p}>{paths[type]}</Svg>
}

export const PlusIcon = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const CloseIcon = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const ChevronLeft = (p: P) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>
export const ChevronRight = (p: P) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>
export const HomeIcon = (p: P) => <Svg {...p}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></Svg>
export const CalendarIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>
)
export const FolderIcon = (p: P) => (
  <Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>
)
export const SettingsIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
  </Svg>
)
export const FileIcon = (p: P) => <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" /></Svg>
export const DownloadIcon = (p: P) => <Svg {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></Svg>
export const LockIcon = (p: P) => <Svg {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>
export const TrashIcon = (p: P) => <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Svg>
export const CameraIcon = (p: P) => (
  <Svg {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Svg>
)
export const SparkleIcon = (p: P) => (
  <Svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></Svg>
)
export const PencilIcon = (p: P) => <Svg {...p}><path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z M14.5 6.5l3 3" /></Svg>
export const TimelineIcon = (p: P) => (
  <Svg {...p}><path d="M6 4v16" /><circle cx="6" cy="7" r="1.6" /><circle cx="6" cy="14" r="1.6" /><path d="M11 7h9M11 14h9M11 19h6" /></Svg>
)
export const ChevronDown = (p: P) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>
