import type { TeamRole } from "@/lib/supabase/database.types";
import { accessRoleLabel } from "./permissions";

const chip = "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]";

// Outlined and raised, so neither reads as the filled 'You' chip.
const TONES = {
  owner: "border border-signal/60 text-signal",
  admin: "bg-raised text-fg-mid",
} as const;

/** Owner or Admin; members get no badge. */
export function AccessRoleBadge({ role }: { role?: TeamRole }) {
  if (!role || role === "member") return null;
  return <span className={`${chip} ${TONES[role]}`}>{accessRoleLabel(role)}</span>;
}
