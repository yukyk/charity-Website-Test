import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      isLoading:       false,

      login(user, tokens) {
        localStorage.setItem('accessToken',  tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        set({ user, token: tokens.accessToken, isAuthenticated: true, isLoading: false });
      },

      logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser(updates) {
        set((state) => ({ user: { ...state.user, ...updates } }));
      },

      setLoading(isLoading) {
        set({ isLoading });
      },
    }),
    {
      name: 'gh-auth',
      // Only persist the identity fields — not transient loading state
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
