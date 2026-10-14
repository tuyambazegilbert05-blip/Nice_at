import Image from 'next/image'

export function CustomFormBrand({
  className = '',
  logoClassName = 'h-12 w-12',
  showName = true,
  showTagline = true,
}: {
  className?: string
  logoClassName?: string
  showName?: boolean
  showTagline?: boolean
}) {
  return <div className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
    <Image
      src="/brand/NiCE-Logo-Animated-transparent.webp"
      alt="NiCE Club Rwanda logo"
      width={680}
      height={680}
      unoptimized
      className={`${logoClassName} shrink-0 object-contain`}
    />
    {(showName || showTagline) && <span className="min-w-0">
      {showName && <span className="block text-sm font-bold leading-tight text-slate-900">NiCE Club Rwanda</span>}
      {showTagline && <span className="mt-0.5 block text-[10px] leading-tight text-slate-500">Nuclear is Clean Energy</span>}
    </span>}
  </div>
}
