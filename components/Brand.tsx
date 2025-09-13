// components/Brand.tsx
import Image from 'next/image'

export default function Brand({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* solo wordmark, sin mini-logo duplicado */}
      <Image
        src="/brand/PLATY_wordmark_1800.png"
        alt="platy"
        width={220}
        height={48}
        priority
        className="h-auto w-auto"
      />
    </div>
  )
}

