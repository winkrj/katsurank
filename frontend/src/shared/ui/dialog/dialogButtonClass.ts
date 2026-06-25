const DIALOG_BUTTON_BASE =
  'flex h-12 flex-1 items-center justify-center rounded-xl border-2 text-[14px] font-bold transition'

export const dialogButtonClass = {
  primary: `${DIALOG_BUTTON_BASE} border-[var(--color-primary-button-border)] bg-[var(--color-primary-button-background)] text-[var(--color-primary-button-text)] hover:brightness-[0.98]`,
  secondary: `${DIALOG_BUTTON_BASE} border-[#E8D9BF] bg-white text-[#2A1A12] hover:bg-[#FFFDF4]`,
} as const
