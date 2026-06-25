import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../shared/ui/AppLayout'
import { HomePage } from '../pages/home/HomePage'
import { KakaoCallbackPage } from '../pages/oauth/KakaoCallbackPage'
import { MyPage } from '../pages/my-page/MyPage'
import { RestaurantDetailPage } from '../pages/restaurant-detail/RestaurantDetailPage'
import { RestaurantNewPage } from '../pages/restaurant-new/RestaurantNewPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Header + BottomNav 포함 레이아웃 */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="/restaurants/new" element={<RestaurantNewPage />} />
          <Route path="/me" element={<MyPage />} />
        </Route>
        {/* 레이아웃 없는 페이지 */}
        <Route path="/oauth/kakao/callback" element={<KakaoCallbackPage />} />
      </Routes>
    </BrowserRouter>
  )
}
