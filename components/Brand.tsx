import Image from 'next/image'

export default function Brand({ size='lg' }: { size?: 'sm'|'lg' }) {
  const h = size === 'lg' ? 48 : 32
  return (
    <div className="flex items-center gap-3">
      <Image src="/brand/PLATY_logo_icon_1024.png" alt="PLATY" width={h} height={h} className="rounded-xl"/>
      <Image src="/brand/PLATY_wordmark_1800.png" alt="PLATY — Menú semanal" width={h*6} height={h*2} style={{height:h}} className="object-contain"/>
    </div>
  )
}
