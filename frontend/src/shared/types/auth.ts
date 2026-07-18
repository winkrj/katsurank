export type AuthMeResponse = {
  id: number
  nickname: string
  profileImage: string | null
}

export type CsrfTokenResponse = {
  token: string
  headerName: string
  parameterName: string
}
