import { Provider } from 'react-redux';
import { store } from './store';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PokerTable from './pages/PokerTable';
function AppToaster() {
  const { pathname } = useLocation();
  const onTable = pathname === '/table';
  return (
    <Toaster
      position={onTable ? 'bottom-left' : 'bottom-right'}
      containerStyle={
        onTable
          ? { left: 24, bottom: 24 }
          : { right: 24, bottom: 24 }
      }
    />
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppToaster />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/table" element={<PokerTable />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
