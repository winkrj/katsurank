import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from '../pages/home/HomePage'
import { KakaoCallbackPage } from '../pages/oauth/KakaoCallbackPage'
import { MyPage } from '../pages/my-page/MyPage'
import { PrivacyPage } from '../pages/legal/PrivacyPage'
import { RestaurantDetailPage } from '../pages/restaurant-detail/RestaurantDetailPage'
import { RestaurantNewPage } from '../pages/restaurant-new/RestaurantNewPage'
import { TermsPage } from '../pages/legal/TermsPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
        <Route path="/restaurants/new" element={<RestaurantNewPage />} />
        <Route path="/me" element={<MyPage />} />
        <Route path="/oauth/kakao/callback" element={<KakaoCallbackPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </BrowserRouter>
  )
}
