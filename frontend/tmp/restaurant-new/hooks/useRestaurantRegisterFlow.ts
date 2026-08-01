import { useState } from 'react'
import { ApiError } from '../../../shared/api/client'
import { useRegisterRestaurantMutation } from '../../../shared/mutations/restaurants'
import type {
  KakaoPlace,
  RegisterCompleteResult,
  RegisterDraft,
  RegisterStep,
} from '../types/registerFlow'
import { getRegistrationStatus } from '../utils/getRegistrationStatus'
import { useKakaoPlaceSearch } from './useKakaoPlaceSearch'

export function useRestaurantRegisterFlow() {
  const [step, setStep] = useState<RegisterStep>('search')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<RegisterDraft | null>(null)
  const [completeResult, setCompleteResult] = useState<RegisterCompleteResult | null>(null)
  const [duplicateAlertOpen, setDuplicateAlertOpen] = useState(false)
  const [blockedReason, setBlockedReason] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)

  const { results, hasSearched, isSearching, searchError, page, totalPages, search, goToPage } =
    useKakaoPlaceSearch()
  const { mutateAsync: registerRestaurant, isPending: isSubmitting } = useRegisterRestaurantMutation()

  function handleSelectPlace(place: KakaoPlace) {
    if (place.isRegistered) {
      setDuplicateAlertOpen(true)
      return
    }
    const status = getRegistrationStatus(place)
    if (!status.canRegister) {
      setBlockedReason(status.reason)
      return
    }
    setDraft({ place })
    setStep('location')
  }

  async function handleSubmitRegister() {
    if (!draft) return
    setRegisterError(null)

    try {
      const result = await registerRestaurant({
        kakaoPlaceId: draft.place.kakaoPlaceId,
        name: draft.place.name,
        address: draft.place.address,
        roadAddress: draft.place.roadAddress,
        latitude: draft.place.latitude,
        longitude: draft.place.longitude,
        kakaoCategory: draft.place.category,
        phone: draft.place.phone,
        placeUrl: draft.place.placeUrl,
      })
      setCompleteResult({
        restaurantId: result.id,
        restaurantName: result.name,
      })
      setStep('complete')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_PLACE') {
        setDuplicateAlertOpen(true)
        return
      }
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
    page,
    totalPages,
    registerError,
    draft,
    completeResult,
    duplicateAlertOpen,
    blockedReason,
    isSubmitting,
    setQuery,
    setDuplicateAlertOpen,
    setBlockedReason,
    setRegisterError,
    handleSearch: search,
    goToPage,
    handleSelectPlace,
    goToSearch: () => setStep('search'),
    goToLocation: () => setStep('location'),
    goToConfirm: () => setStep('confirm'),
    handleSubmitRegister,
  }
}
