import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../shared/ui/AppLayout'
import { KakaoCallbackPage } from '../pages/oauth/KakaoCallbackPage'
import { MainPage } from '../pages/main/MainPage'
import { PrivacyPolicyPage } from '../pages/legal/PrivacyPolicyPage'
import { TermsPage } from '../pages/legal/TermsPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Header 포함 레이아웃 */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<MainPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Route>
        {/* 레이아웃 없는 페이지 */}
        <Route path="/oauth/callback" element={<KakaoCallbackPage />} />
      </Routes>
    </BrowserRouter>
  )
}
