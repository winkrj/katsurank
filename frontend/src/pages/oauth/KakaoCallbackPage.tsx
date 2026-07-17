import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { consumeLoginRedirect } from '../../shared/lib/loginRedirect'

export function KakaoCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(consumeLoginRedirect(), { replace: true })
  }, [navigate])

  return null
}
