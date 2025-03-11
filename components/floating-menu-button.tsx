"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface FloatingMenuButtonProps {
  onClick: () => void
}

export default function FloatingMenuButton({ onClick }: FloatingMenuButtonProps) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className="fixed bottom-4 right-4 rounded-full shadow-lg z-10 md:hidden"
      onClick={onClick}
    >
      <Menu className="w-5 h-5" />
    </Button>
  )
}

