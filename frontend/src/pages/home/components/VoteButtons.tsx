import { Button } from '../../../shared/ui/Button'
import { KAKAO_LOGIN_URL } from '../../../shared/constant/api'
import { useNavigate } from 'react-router-dom'

type VoteButtonsProps = {
  isLoggedIn: boolean
  layout?: 'default' | 'mobile'
}

export function VoteButtons({ isLoggedIn, layout = 'default' }: VoteButtonsProps) {
  const isMobileLayout = layout === 'mobile'
  const navigate = useNavigate()
  const btnClass = isMobileLayout ? 'mobile-hero__btn' : undefined
  const containerClass = isMobileLayout
    ? 'mobile-hero__buttons grid grid-cols-2'
    : 'grid grid-cols-2 gap-3'

  return (
    <div className={containerClass}>
      {isLoggedIn ? (
        <Button tag="button" variant="primary" className={btnClass}>
          내 한 표 던지기
        </Button>
      ) : (
        <Button tag="a" variant="primary" href={KAKAO_LOGIN_URL} className={btnClass}>
          내 한 표 던지기
        </Button>
      )}

      <Button tag="button" variant="secondary" className={btnClass} onClick={() => navigate('/map')}>
        지도 보기
      </Button>
    </div>
  )
}
