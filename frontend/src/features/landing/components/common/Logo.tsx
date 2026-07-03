import Image from "next/image"
import Link from "next/link"

import { cn } from "@lib/utils"

type LogoProps = {
  href?: string
  className?: string
}

/** MediNex+ wordmark (provided asset in /public). The white variant is used directly in the footer. */
export function Logo({ href = "/", className }: LogoProps) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label="MediNex+ home">
      <Image
        src="/medinexplus-logo-normal.png"
        alt="MediNex+"
        width={1045}
        height={199}
        priority
        className="h-9 w-auto"
      />
    </Link>
  )
}
