/** Converts a clock string between the 24-hour and 12-hour notations. */

const pad = (n: number) => String(n).padStart(2, '0')

/** `14:30` or `14:30:05` -> `02:30 PM`. Values already in 12-hour pass through. */
export function to12Hour(value: string): string {
  if (!value || /[ap]m$/i.test(value.trim())) return value
  const [h = '0', m = '00', s] = value.trim().split(':')
  const hour = Number(h)
  if (Number.isNaN(hour)) return value
  const clock = [pad(hour % 12 || 12), m.padStart(2, '0')]
  if (s !== undefined) clock.push(s.padStart(2, '0'))
  return `${clock.join(':')} ${hour >= 12 ? 'PM' : 'AM'}`
}

/** `02:30 PM` -> `14:30`. Values already in 24-hour pass through. */
export function to24Hour(value: string): string {
  if (!value) return value
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)$/i)
  if (!match) return value
  const [, h = '0', m = '00', s, meridiem = 'AM'] = match
  const hour = (Number(h) % 12) + (meridiem.toUpperCase() === 'PM' ? 12 : 0)
  return [pad(hour), m, s].filter((part) => part !== undefined).join(':')
}
