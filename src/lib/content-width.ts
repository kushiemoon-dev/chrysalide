export type ContentWidth = 'dashboard' | 'onboarding' | 'large' | 'standard'

const LARGE_EXACT_PATHS = [
  '/appointments/calendar',
  '/medications/calendar',
  '/progress',
  '/progress/compare',
]

const BLOODTEST_DETAIL = /^\/bloodtests\/(?!new$)[^/]+$/

export function getContentWidthClass(pathname: string): ContentWidth {
  if (pathname === '/') return 'dashboard'
  if (pathname.startsWith('/onboarding')) return 'onboarding'
  if (LARGE_EXACT_PATHS.includes(pathname)) return 'large'
  if (BLOODTEST_DETAIL.test(pathname)) return 'large'
  return 'standard'
}
