import { useState } from 'react'
import { MOCK_REGISTERED_RESTAURANT_ID } from '../constants'
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { results, hasSearched, isSearching, searchError, search } = useKakaoPlaceSearch()

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

  function handleSubmitRegister() {
    if (!draft) return
    setIsSubmitting(true)
    window.setTimeout(() => {
      setCompleteResult({
        restaurantId: MOCK_REGISTERED_RESTAURANT_ID,
        restaurantName: draft.place.name,
      })
      setStep('complete')
      setIsSubmitting(false)
    }, 600)
  }

  return {
    step,
    query,
    results,
    hasSearched,
    isSearching,
    searchError,
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
