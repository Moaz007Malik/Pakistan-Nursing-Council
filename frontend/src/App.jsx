import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes';
import { fetchMe } from './features/auth/authSlice';
import { connectSocket, disconnectSocket } from './services/socket';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMe());
      connectSocket(accessToken);
    }
    return () => disconnectSocket();
  }, [isAuthenticated, accessToken, dispatch]);

  return <AppRoutes />;
}

export default App;
