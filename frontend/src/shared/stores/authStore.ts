import { create } from 'zustand'

interface User {
  id: number
  nickname: string
  profileImage: string | null
}

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  isLoggedIn: () => get().user !== null,
}))
