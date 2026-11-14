/** Simple schematic drawings of the 7 Bristol stool types. */
export function BristolIcon({ n, size = 56 }: { n: number; size?: number }) {
  const c = '#92400e'
  const light = '#b45309'
  const shapes: Record<number, React.ReactNode> = {
    1: (
      <>
        <circle cx="14" cy="22" r="6" fill={c} /><circle cx="29" cy="18" r="5" fill={c} />
        <circle cx="43" cy="23" r="6" fill={c} /><circle cx="24" cy="32" r="5" fill={c} />
        <circle cx="38" cy="34" r="4.5" fill={c} />
      </>
    ),
    2: (
      <path fill={c} d="M6 26c0-5 4-8 8-7 2-4 7-5 10-2 3-3 8-3 10 1 4-2 9 0 10 4 4 0 6 3 6 6s-3 6-7 5c-2 4-7 5-10 2-3 3-8 3-11 0-3 3-8 2-10-1-4 0-6-4-6-8z" />
    ),
    3: (
      <>
        <rect x="5" y="19" width="46" height="15" rx="7.5" fill={c} />
        <path d="M15 20l2 5M24 33l1-5M32 20l1 5M41 33l1-5" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
    4: <path fill={c} d="M6 30c0-6 6-9 12-7 6 2 10-4 17-3 7 1 12 4 15 8 2 3 0 7-4 7H11c-3 0-5-2-5-5z" />,
    5: (
      <>
        <ellipse cx="14" cy="24" rx="8" ry="6" fill={light} /><ellipse cx="32" cy="20" rx="8" ry="5.5" fill={light} />
        <ellipse cx="24" cy="35" rx="9" ry="5.5" fill={light} /><ellipse cx="43" cy="32" rx="7" ry="5" fill={light} />
      </>
    ),
    6: (
      <path fill={light} d="M5 32c2-6 6-5 8-9 3-4 7-1 10-4 4-3 7 1 11-1 4-2 8 2 10 5 3 3 7 3 7 7 0 5-5 6-9 5-4 2-9 3-13 1-5 2-10 2-14 0-5 1-11 1-10-4z" />
    ),
    7: (
      <>
        <path fill="#d97706" opacity="0.55" d="M4 34c4-4 10-5 16-4s12-3 18-2 12 3 14 6c-4 4-12 5-18 4s-12 2-18 1-10-2-12-5z" />
        <circle cx="16" cy="22" r="2.5" fill="#d97706" opacity="0.7" /><circle cx="36" cy="20" r="2" fill="#d97706" opacity="0.7" />
      </>
    ),
  }
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 56 45" aria-hidden="true">
      {shapes[n]}
    </svg>
  )
}
