interface IconProps {
  className?: string
}

export function SealIcon({ className = "" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
      <path d="M12 8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z" />
      <path d="M10 16c0 1.1.9 2 2 2s2-.9 2-2" />
      <path d="M9 10c-.6 0-1 .4-1 1s.4 1 1 1" />
      <path d="M15 10c.6 0 1 .4 1 1s-.4 1-1 1" />
    </svg>
  )
}

export function BombIcon({ className = "" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.9 4.9l2.8 2.8" />
      <path d="M16.3 16.3l2.8 2.8" />
      <path d="M4.9 19.1l2.8-2.8" />
      <path d="M16.3 7.7l2.8-2.8" />
    </svg>
  )
}

