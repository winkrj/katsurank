import type { ReactNode } from 'react'
import { DialogCrownIcon } from './DialogCrownIcon'
import { dialogButtonClass } from './dialogButtonClass'
import { DialogShell } from './DialogShell'

type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: ReactNode
  description?: ReactNode
  cancelLabel?: string
  confirmLabel?: string
  icon?: ReactNode
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  cancelLabel = '취소',
  confirmLabel = '확인',
  icon = <DialogCrownIcon />,
}: ConfirmDialogProps) {
  function handleConfirm() {
    onConfirm()
    onClose()
  }

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className={dialogButtonClass.secondary} onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="button" className={dialogButtonClass.primary} onClick={handleConfirm}>
            {confirmLabel}
          </button>
        </div>
      }
    />
  )
}
