import Image from "next/image";
import type { Screenshot } from "@/lib/screenshots";

type BrowserFrameProps = {
  shot: Screenshot;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Address shown in the URL pill. */
  url?: string;
};

/** The chrome bar: neutral window dots + mono URL pill. */
export function BrowserChrome({ url = "beta.ftcflow.app" }: { url?: string }) {
  return (
    <div className="relative flex items-center border-b border-edge px-4 py-2.5">
      <span aria-hidden className="flex gap-1.5">
        <span className="size-2 rounded-full bg-fg-dim/25" />
        <span className="size-2 rounded-full bg-fg-dim/25" />
        <span className="size-2 rounded-full bg-fg-dim/25" />
      </span>
      <span className="absolute left-1/2 -translate-x-1/2 rounded-md bg-ink px-3 py-1 font-mono text-[11px] tracking-[0.04em] text-fg-dim">
        {url}
      </span>
    </div>
  );
}

/**
 * The web counterpart of the device frame: a browser-shaped shell (Surface
 * fill, hairline chrome, neutral window dots, mono URL pill) around a real
 * capture of the web app. Same honesty rule as the phone: the frame never
 * crops or distorts what the product actually looks like.
 */
export function BrowserFrame({
  shot,
  sizes = "(min-width: 1024px) 640px, 92vw",
  priority = false,
  className,
  url = "beta.ftcflow.app",
}: BrowserFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-[16px] border border-edge bg-surface ${className ?? ""}`}
    >
      <BrowserChrome url={url} />
      <Image
        src={shot.src}
        alt={shot.alt}
        width={shot.width}
        height={shot.height}
        sizes={sizes}
        priority={priority}
        className="w-full"
      />
    </div>
  );
}
