import { buttonPrimary } from "@/lib/ui";

// authCard and authHeadline from app/(auth)/_components/fields.tsx, repeated
// because that is a client module: a Server Component importing a string from
// it gets a client reference, not the string.
const card = "rounded-2xl border border-edge bg-surface p-7 sm:p-9";
const headline = "text-[1.75rem] font-medium leading-[1.15] tracking-[-0.01em] text-balance";

/**
 * Shown when onboarding can't tell where the user stands: Supabase is
 * unreachable, or the team migration isn't applied. Plain links, so both
 * work without JavaScript and reload every server-resolved value.
 */
export function Unavailable({ message, retryHref }: { message: string; retryHref: string }) {
  return (
    <div className={card}>
      <h1 className={headline}>{"We couldn't open setup"}</h1>
      <p className="mt-3 leading-relaxed text-fg-mid">{message}</p>
      <a href={retryHref} className={`${buttonPrimary} mt-7 w-full`}>
        Try again
      </a>
      <p className="mt-5 text-center text-sm">
        <a href="/beta" className="text-fg-mid underline-offset-2 hover:text-fg hover:underline">
          Open FTC Flow
        </a>
      </p>
    </div>
  );
}
