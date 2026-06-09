/** Unsplash portrait photos (free to use under the Unsplash License). */

export type LandingFace = {
  id: string
  name: string
  role: string
  /** Full Unsplash image URL with crop tuned for faces */
  src: string
}

function face(photoId: string, size = 160): string {
  return `https://images.unsplash.com/${photoId}?w=${size}&h=${size}&fit=crop&crop=faces&auto=format&q=85`
}

export const LANDING_FACES: LandingFace[] = [
  {
    id: 'sarah',
    name: 'Sarah M.',
    role: 'Elementary teacher',
    src: face('photo-1494790108377-be9c29b29330'),
  },
  {
    id: 'james',
    name: 'James K.',
    role: 'Software engineer',
    src: face('photo-1507003211169-0a1dd7228f2d'),
  },
  {
    id: 'priya',
    name: 'Priya R.',
    role: 'Freelance designer',
    src: face('photo-1580489944761-15a19d654956'),
  },
  {
    id: 'marcus',
    name: 'Marcus T.',
    role: 'Small business owner',
    src: face('photo-1500648767791-00dcc994a43e'),
  },
  {
    id: 'elena',
    name: 'Elena V.',
    role: 'Graduate student',
    src: face('photo-1438761681033-6461ffad8d80'),
  },
  {
    id: 'david',
    name: 'David L.',
    role: 'Healthcare admin',
    src: face('photo-1472099645785-5658abf4ff4e'),
  },
  {
    id: 'amira',
    name: 'Amira H.',
    role: 'Marketing manager',
    src: face('photo-1534528741775-53994a69daeb'),
  },
  {
    id: 'chris',
    name: 'Chris P.',
    role: 'Sales rep',
    src: face('photo-1560250097-0b93528c311a'),
  },
]

export const LANDING_TESTIMONIALS = [
  {
    face: LANDING_FACES[0],
    quote:
      'Envelope budgeting finally clicked for me. I know exactly what I can spend without opening a spreadsheet.',
  },
  {
    face: LANDING_FACES[2],
    quote:
      'Recurring bills used to surprise me every month. Now rent and subscriptions are planned before they hit.',
  },
  {
    face: LANDING_FACES[3],
    quote:
      'The cashflow view helped me spot a tight week before my account went negative. That alone was worth it.',
  },
] as const

/** Decorative positions for hero floating portraits (large screens). */
export const HERO_FLOATING_FACES = LANDING_FACES.slice(0, 5).map((face, i) => ({
  ...face,
  className: [
    'top-[12%] left-[8%] w-14 h-14 sm:w-16 sm:h-16',
    'top-[20%] right-[10%] w-12 h-12 sm:w-14 sm:h-14',
    'bottom-[28%] left-[6%] w-11 h-11 sm:w-12 sm:h-12',
    'bottom-[18%] right-[8%] w-14 h-14 sm:w-16 sm:h-16',
    'top-[45%] left-[4%] w-10 h-10 sm:w-12 sm:h-12',
  ][i],
  delay: i * 0.5,
}))
