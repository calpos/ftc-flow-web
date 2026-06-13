import Image from "next/image";
import type { Screenshot } from "@/lib/screenshots";

type PhoneProps = {
  shot: Screenshot;
  priority?: boolean;
  sizes?: string;
  glow?: boolean;
  className?: string;
};

/**
 * The site's signature artifact: a phone-shaped shell around a real app
 * capture, optionally backlit by the one sanctioned radial glow.
 */
export function Phone({
  shot,
  priority = false,
  sizes = "(min-width: 768px) 300px, 72vw",
  glow = false,
  className,
}: PhoneProps) {
  return (
    <div className={`relative isolate ${className ?? ""}`}>
      {glow ? (
        <div aria-hidden className="backlight absolute -inset-[18%] -z-10" />
      ) : null}
      <div className="rounded-[2.5rem] border border-edge bg-surface p-2.5">
        <Image
          src={shot.src}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          priority={priority}
          sizes={sizes}
          className="w-full rounded-[2rem]"
        />
      </div>
    </div>
  );
}
