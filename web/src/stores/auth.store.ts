'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  // Estado
  token: string | null;
  isAuthenticated: boolean;

  // Acciones
  login: (token: string) => void;
  logout: () => void;
}

// 2. Creamos el Store con persistencia en LocalStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // --- ESTADO INICIAL ---
      token: null,
      isAuthenticated: false,

      login: (token: string) => {
        set({ 
          token, 
          isAuthenticated: true 
        });
      },

      // Al hacer logout, limpiamos todo
      logout: () => {
        set({ 
          token: null, 
          isAuthenticated: false 
        });
      },
    }),
    {
      name: 'american-way-auth-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);
