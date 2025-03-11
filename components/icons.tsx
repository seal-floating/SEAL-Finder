interface IconProps {
  className?: string
}

export function SealIcon({ className = "" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* Main seal face - filled circle */}
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      
      {/* Eyes */}
      <circle cx="9" cy="9" r="1.5" fill="white" />
      <circle cx="15" cy="9" r="1.5" fill="white" />
      <circle cx="9" cy="9" r="0.5" fill="black" />
      <circle cx="15" cy="9" r="0.5" fill="black" />
      
      {/* Nose */}
      <ellipse cx="12" cy="12" rx="2" ry="1.5" fill="black" />
      
      {/* Mouth */}
      <path d="M8.5 14.5C10 16 14 16 15.5 14.5" stroke="white" strokeWidth="1" fill="none" />
      
      {/* Whiskers */}
      <line x1="5" y1="12" x2="8" y2="12" stroke="white" strokeWidth="0.75" />
      <line x1="16" y1="12" x2="19" y2="12" stroke="white" strokeWidth="0.75" />
      <line x1="5" y1="10.5" x2="8" y2="11" stroke="white" strokeWidth="0.75" />
      <line x1="16" y1="11" x2="19" y2="10.5" stroke="white" strokeWidth="0.75" />
      <line x1="5" y1="13.5" x2="8" y2="13" stroke="white" strokeWidth="0.75" />
      <line x1="16" y1="13" x2="19" y2="13.5" stroke="white" strokeWidth="0.75" />
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

