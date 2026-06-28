import { useState } from 'react'
import { MOCK_REGISTERED_RESTAURANT_ID } from '../constants'
import { searchMockKakaoPlaces } from '../mocks/kakaoPlaces.mock'
import type {
  KakaoPlace,
  RegisterCompleteResult,
  RegisterDraft,
  RegisterStep,
} from '../types/registerFlow'

export function useRestaurantRegisterFlow() {
  const [step, setStep] = useState<RegisterStep>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [draft, setDraft] = useState<RegisterDraft | null>(null)
  const [completeResult, setCompleteResult] = useState<RegisterCompleteResult | null>(null)
  const [duplicateAlertOpen, setDuplicateAlertOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSearch(searchQuery: string) {
    setHasSearched(true)
    setResults(searchMockKakaoPlaces(searchQuery))
  }

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
    draft,
    completeResult,
    duplicateAlertOpen,
    isSubmitting,
    setQuery,
    setDuplicateAlertOpen,
    handleSearch,
    handleSelectPlace,
    handlePhotoChange,
    goToSearch: () => setStep('search'),
    goToLocation: () => setStep('location'),
    goToConfirm: () => setStep('confirm'),
    handleSubmitRegister,
  }
}
