'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  // Estado
  token: string | null;
  isAuthenticated: boolean;
  role: 'admin' | 'encargado' | 'owner' | null;
  branch: { id: string; name: string; slug: string } | null;

  // Acciones
  login: (token: string, role: 'admin' | 'encargado' | 'owner', branch: AuthState['branch']) => void;
  logout: () => void;
}

// 2. Creamos el Store con persistencia en LocalStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // --- ESTADO INICIAL ---
      token: null,
      isAuthenticated: false,
      role: null,
      branch: null,

      login: (token, role, branch) => {
        set({ 
          token, 
          isAuthenticated: true,
          role,
          branch,
        });
      },

      // Al hacer logout, limpiamos todo
      logout: () => {
        set({ 
          token: null, 
          isAuthenticated: false,
          role: null,
          branch: null,
        });
      },
    }),
    {
      name: 'american-way-auth-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);
