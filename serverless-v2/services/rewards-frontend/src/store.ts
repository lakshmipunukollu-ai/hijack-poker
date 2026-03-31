import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { rewardsApi } from './api/rewardsApi';

interface AuthState {
  playerId: string | null;
  token: string | null;
  isAuthenticated: boolean;
}

function loadAuthFromStorage(): AuthState {
  const jwt = localStorage.getItem('jwt');
  const playerId = localStorage.getItem('playerId');
  if (!jwt) {
    if (playerId) localStorage.removeItem('playerId');
    return { playerId: null, token: null, isAuthenticated: false };
  }
  if (!playerId) {
    localStorage.removeItem('jwt');
    return { playerId: null, token: null, isAuthenticated: false };
  }
  return { playerId, token: jwt, isAuthenticated: true };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadAuthFromStorage(),
  reducers: {
    login(state, action: PayloadAction<{ playerId: string; token: string }>) {
      state.playerId = action.payload.playerId;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('playerId', action.payload.playerId);
      localStorage.setItem('jwt', action.payload.token);
    },
    logout(state) {
      state.playerId = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('playerId');
      localStorage.removeItem('jwt');
    },
  },
});

export const { login, logout } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [rewardsApi.reducerPath]: rewardsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(rewardsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
