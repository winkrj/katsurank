import { useIsMobile } from '../../shared/hooks/useIsMobile';
import { AlertDialog } from '../../shared/ui/dialog';
import { RegisterComplete } from './components/RegisterComplete';
import { RegisterLayout } from './components/RegisterLayout';
import { RegisterStepConfirm } from './components/RegisterStepConfirm';
import { RegisterStepLocation } from './components/RegisterStepLocation';
import { RegisterStepSearch } from './components/RegisterStepSearch';
import { useRestaurantRegisterFlow } from './hooks/useRestaurantRegisterFlow';

export function RestaurantNewPage() {
  const isMobile = useIsMobile();
  const flow = useRestaurantRegisterFlow();

  const mainClass = isMobile
    ? 'bg-[#FFFDF4] pb-[68px] pt-14 text-[#2A1A12]'
    : 'bg-[#FFFDF4] pt-20 text-[#2A1A12]';

  if (flow.step === 'complete' && flow.completeResult) {
    return (
      <main className={mainClass}>
        <div className={isMobile ? 'px-4 py-5' : 'mx-auto max-w-[1280px] px-8 py-10'}>
          <RegisterComplete result={flow.completeResult} layout={isMobile ? 'mobile' : 'desktop'} />
        </div>
      </main>
    );
  }

  return (
    <main className={mainClass}>
      <div className={isMobile ? '' : 'mx-auto max-w-[1280px] px-8'}>
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
    </main>
  );
}
