// components/Brand.tsx
import Image from "next/image";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<Size, number> = {
  sm: 28,   // ~h-7
  md: 40,   // ~h-10
  lg: 56,   // ~h-14
  xl: 72,   // ~h-18
};

export default function Brand({ size = "lg" }: { size?: Size }) {
  const h = SIZE_MAP[size];
  // Relación de aspecto aprox del wordmark: 5:1 (ajústalo si ves deformación)
  const wordmarkW = Math.round(h * 5);

  return (
    <div className="flex items-center gap-3">
      <Image
        src="/brand/PLATY_logo_icon_1024.png"
        alt="PLATY"
        width={h}
        height={h}
        className="rounded-xl"
        priority
      />
      <Image
        src="/brand/PLATY_wordmark_1800.png"
        alt="PLATY"
        width={wordmarkW}
        height={h}
        className="object-contain"
        priority
      />
    </div>
  );
}
