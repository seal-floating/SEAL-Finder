import Image from "next/image"

interface SealImageProps {
  className?: string
}

export default function SealImage({ className = "" }: SealImageProps) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/seal-xXYLC7LIhzGIPk5xyZkM1DCQ5K68cB.png"
        alt="Seal"
        width={40}
        height={40}
        className="w-full h-full object-contain"
      />
    </div>
  )
}

