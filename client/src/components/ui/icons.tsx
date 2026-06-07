import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const IconLayoutDashboard = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
)

export const IconWallet = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    <path d="M16 12h3" />
    <path d="M3 9h18" />
  </svg>
)

export const IconReceipt = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
)

export const IconRepeat = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
)

export const IconBarChart = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 3v18h18" />
    <rect x="7" y="12" width="3" height="6" rx="0.5" />
    <rect x="12.5" y="8" width="3" height="10" rx="0.5" />
    <rect x="18" y="5" width="3" height="13" rx="0.5" />
  </svg>
)

export const IconSettings = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
)

export const IconArrowRight = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
)

export const IconPlus = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconAlertTriangle = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m10.29 3.86-8.18 14.18A1 1 0 0 0 3 19.7h18a1 1 0 0 0 .89-1.66L13.71 3.86a1 1 0 0 0-1.72 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
)

export const IconTrendingUp = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m22 7-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </svg>
)

export const IconShield = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" />
  </svg>
)

export const IconClock = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const IconCalculator = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <rect x="7" y="5" width="10" height="4" rx="1" />
    <rect x="7" y="11" width="2.75" height="2.75" rx="0.75" />
    <rect x="10.625" y="11" width="2.75" height="2.75" rx="0.75" />
    <rect x="14.25" y="11" width="2.75" height="2.75" rx="0.75" />
    <rect x="7" y="15" width="2.75" height="2.75" rx="0.75" />
    <rect x="10.625" y="15" width="2.75" height="2.75" rx="0.75" />
    <rect x="14.25" y="15" width="2.75" height="2.75" rx="0.75" />
    <rect x="7" y="19" width="6.125" height="2.75" rx="0.75" />
    <rect x="14.25" y="19" width="2.75" height="2.75" rx="0.75" />
  </svg>
)

export const IconArrowLeftRight = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m17 3 4 4-4 4" />
    <path d="M3 7h18" />
    <path d="m7 21-4-4 4-4" />
    <path d="M21 17H3" />
  </svg>
)

export const IconSplit = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 3v6a3 3 0 0 0 3 3h6" />
    <path d="M6 3 4 5l2 2M18 9l2 2-2 2" />
    <path d="M6 21v-6" />
  </svg>
)

export const IconSearch = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

export const IconLogo = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="3" y="13" width="3.5" height="8" rx="1" fill="currentColor" />
    <rect x="9.25" y="9" width="3.5" height="12" rx="1" fill="currentColor" />
    <rect x="15.5" y="5" width="3.5" height="16" rx="1" fill="currentColor" />
    <path
      d="M3 12.5 8.5 7l3.5 3 6-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path d="M14 4h4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)
