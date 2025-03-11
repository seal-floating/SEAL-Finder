import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format time as MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

// Get time color based on remaining time percentage
export function getTimeColor(remainingTime: number, totalTime: number): string {
  const percentage = remainingTime / totalTime

  if (percentage <= 0.25) {
    return "text-red-500" // Less than 25% time remaining
  } else if (percentage <= 0.5) {
    return "text-orange-500" // Less than 50% time remaining
  } else {
    return "text-gray-500" // More than 50% time remaining
  }
}

