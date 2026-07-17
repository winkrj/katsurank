const LOGIN_REDIRECT_KEY = 'katsurank:loginRedirect'

/** 로그인 버튼 클릭 시점의 현재 경로를 저장한다. 카카오 로그인 페이지로 이동하기 직전에 호출한다. */
export function saveLoginRedirect() {
  const path = `${window.location.pathname}${window.location.search}`
  sessionStorage.setItem(LOGIN_REDIRECT_KEY, path)
}

/** 로그인 콜백에서 저장된 경로를 꺼내고 즉시 지운다. 값이 없거나 유효하지 않으면 홈으로 보낸다. */
export function consumeLoginRedirect(): string {
  const path = sessionStorage.getItem(LOGIN_REDIRECT_KEY)
  sessionStorage.removeItem(LOGIN_REDIRECT_KEY)
  return path && path.startsWith('/') && !path.startsWith('//') ? path : '/'
}
