import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../shared/ui/AppLayout'
import { HomePage } from '../pages/home/HomePage'
import { KakaoCallbackPage } from '../pages/oauth/KakaoCallbackPage'
import { MyPage } from '../pages/my-page/MyPage'
import { RestaurantDetailPage } from '../pages/restaurant-detail/RestaurantDetailPage'
import { RestaurantNewPage } from '../pages/restaurant-new/RestaurantNewPage'
import { MapPage } from '../pages/map/MapPage'
import { RankingsPage } from '../pages/rankings/RankingsPage'
import { SearchPage } from '../pages/search/SearchPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Header + BottomNav 포함 레이아웃 */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants/new" element={<RestaurantNewPage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/me" element={<MyPage />} />
        </Route>
        {/* 레이아웃 없는 페이지 */}
        <Route path="/oauth/kakao/callback" element={<KakaoCallbackPage />} />
      </Routes>
    </BrowserRouter>
  )
}
