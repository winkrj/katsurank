import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertDialog } from '../../../../shared/ui/dialog'
import { useRestaurantRegisterFlow } from '../../hooks/useRestaurantRegisterFlow'
import { RegisterComplete } from './RegisterComplete'
import { RegisterLayout } from './RegisterLayout'
import { RegisterStepConfirm } from './RegisterStepConfirm'
import { RegisterStepLocation } from './RegisterStepLocation'
import { RegisterStepSearch } from './RegisterStepSearch'

type RegisterRestaurantModalProps = {
  open: boolean
  isMobile: boolean
  onClose: () => void
  onViewRestaurant: (id: number) => void
}

export function RegisterRestaurantModal({ open, isMobile, onClose, onViewRestaurant }: RegisterRestaurantModalProps) {
  const flow = useRestaurantRegisterFlow()

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  function handleClose() {
    onClose()
    flow.reset()
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="닫기" onClick={handleClose} />

      <div
        role="dialog"
        aria-modal="true"
        className={
          isMobile
            ? 'relative z-10 h-full w-full overflow-y-auto bg-[#FFFDF4] px-4 py-5'
            : 'relative z-10 max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-[#FFFDF4] p-8 shadow-[0_24px_64px_rgba(42,26,18,0.24)]'
        }
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-[20px] font-black text-[#2A1A12]">새 가게 등록하기</h1>
          <button
            type="button"
            onClick={handleClose}
            aria-label="닫기"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#2A1A12] transition hover:bg-black/10"
          >
            <CloseIcon />
          </button>
        </div>

        {flow.step === 'complete' && flow.completeResult ? (
          <RegisterComplete
            result={flow.completeResult}
            layout={isMobile ? 'mobile' : 'desktop'}
            onViewDetail={(id) => {
              handleClose()
              onViewRestaurant(id)
            }}
            onClose={handleClose}
          />
        ) : (
          <RegisterLayout currentStep={flow.step} layout={isMobile ? 'mobile' : 'desktop'}>
            {flow.step === 'search' && (
              <RegisterStepSearch
                query={flow.query}
                results={flow.hasSearched ? flow.results : []}
                isSearching={flow.isSearching}
                searchError={flow.searchError}
                page={flow.page}
                totalPages={flow.totalPages}
                onQueryChange={flow.setQuery}
                onSearch={flow.handleSearch}
                onSelect={flow.handleSelectPlace}
                onViewRegistered={(id) => {
                  handleClose()
                  onViewRestaurant(id)
                }}
                onPageChange={flow.goToPage}
              />
            )}

            {flow.step === 'location' && flow.draft && (
              <RegisterStepLocation
                place={flow.draft.place}
                onPrev={flow.goToSearch}
                onNext={flow.goToConfirm}
              />
            )}

            {flow.step === 'confirm' && flow.draft && (
              <RegisterStepConfirm
                place={flow.draft.place}
                onPrev={flow.goToLocation}
                onSubmit={flow.handleSubmitRegister}
                isSubmitting={flow.isSubmitting}
              />
            )}
          </RegisterLayout>
        )}
      </div>

      <AlertDialog
        open={flow.duplicateAlertOpen}
        onClose={() => flow.setDuplicateAlertOpen(false)}
        title="이미 등록된 가게예요!"
        description="이미 등록된 가게는 다시 등록할 수 없어요. 가게 상세에서 확인해 주세요."
        confirmLabel="확인"
      />

      <AlertDialog
        open={flow.blockedReason !== null}
        onClose={() => flow.setBlockedReason(null)}
        title="등록할 수 없는 가게예요"
        description={flow.blockedReason}
        confirmLabel="확인"
      />

      <AlertDialog
        open={flow.registerError !== null}
        onClose={() => flow.setRegisterError(null)}
        title="등록에 실패했어요"
        description={flow.registerError}
        confirmLabel="확인"
      />
    </div>,
    document.body,
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  )
}
