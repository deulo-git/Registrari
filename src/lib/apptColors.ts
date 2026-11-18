/** One colour per group of appointment (calendar badge background / ink). */
export const APPT_COLORS: Record<string, { bg: string; ink: string }> = {
  emergency: { bg: '#fee2e2', ink: '#b91c1c' },
  consultation: { bg: '#dcfce7', ink: '#15803d' },
  test: { bg: '#dbeafe', ink: '#1d4ed8' },
  other: { bg: '#ede9fe', ink: '#6d28d9' },
}
