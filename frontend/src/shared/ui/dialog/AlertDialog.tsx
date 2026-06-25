import type { ReactNode } from 'react'
import { DialogCrownIcon } from './DialogCrownIcon'
import { dialogButtonClass } from './dialogButtonClass'
import { DialogShell } from './DialogShell'

type AlertDialogProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  icon?: ReactNode
}

export function AlertDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = '확인',
  icon = <DialogCrownIcon />,
}: AlertDialogProps) {
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      footer={
        <button type="button" className={`${dialogButtonClass.primary} w-full`} onClick={onClose}>
          {confirmLabel}
        </button>
      }
    />
  )
}
