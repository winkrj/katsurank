import { useState } from 'react'
import { useRegisterRestaurantMutation } from '../../../shared/mutations/restaurants'
import type {
  KakaoPlace,
  RegisterCompleteResult,
  RegisterDraft,
  RegisterStep,
} from '../types/registerFlow'
import { useKakaoPlaceSearch } from './useKakaoPlaceSearch'

export function useRestaurantRegisterFlow() {
  const [step, setStep] = useState<RegisterStep>('search')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<RegisterDraft | null>(null)
  const [completeResult, setCompleteResult] = useState<RegisterCompleteResult | null>(null)
  const [duplicateAlertOpen, setDuplicateAlertOpen] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  const { results, hasSearched, isSearching, searchError, search } = useKakaoPlaceSearch()
  const { mutateAsync: registerRestaurant, isPending: isSubmitting } = useRegisterRestaurantMutation()

  function handleSelectPlace(place: KakaoPlace) {
    if (place.isRegistered) {
      setDuplicateAlertOpen(true)
      return
    }
    setDraft({ place, photoPreview: null })
    setStep('location')
  }

  function handlePhotoChange(preview: string | null) {
    if (!draft) return
    setDraft({ ...draft, photoPreview: preview })
  }

  async function handleSubmitRegister() {
    if (!draft) return
    setRegisterError(null)

    try {
      const result = await registerRestaurant({
        kakaoPlaceId: draft.place.kakaoPlaceId,
        name: draft.place.name,
        address: draft.place.address,
        latitude: draft.place.latitude,
        longitude: draft.place.longitude,
      })
      setCompleteResult({
        restaurantId: result.id,
        restaurantName: result.name,
      })
      setStep('complete')
    } catch {
      setRegisterError('가게 등록에 실패했어요. 다시 시도해주세요.')
    }
  }

  return {
    step,
    query,
    results,
    hasSearched,
    isSearching,
    searchError,
    registerError,
    draft,
    completeResult,
    duplicateAlertOpen,
    isSubmitting,
    setQuery,
    setDuplicateAlertOpen,
    handleSearch: search,
    handleSelectPlace,
    handlePhotoChange,
    goToSearch: () => setStep('search'),
    goToLocation: () => setStep('location'),
    goToConfirm: () => setStep('confirm'),
    handleSubmitRegister,
  }
}
