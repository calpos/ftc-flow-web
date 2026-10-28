export const buttonPrimary =
  "inline-flex h-12 items-center justify-center rounded-[10px] bg-signal px-6 font-medium text-ink transition-colors duration-150 hover:bg-[#4d9dff] disabled:cursor-not-allowed disabled:opacity-60";

export const buttonSecondary =
  "inline-flex h-12 items-center justify-center rounded-[10px] border border-edge bg-raised px-6 font-medium text-fg transition-colors duration-150 hover:border-signal-dim";

/** Text field on Surface Raised. Set aria-invalid for the danger border. */
export const textInput =
  "block w-full rounded-[10px] border border-edge bg-raised px-4 py-3.5 text-fg placeholder:text-fg-dim transition-colors duration-150 focus:border-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:outline-danger";

/** The Detail Voice: mono, uppercase, tracked. Kickers, indices, meta lines. */
export const monoLabel =
  "font-mono text-xs font-medium uppercase tracking-[0.14em]";
