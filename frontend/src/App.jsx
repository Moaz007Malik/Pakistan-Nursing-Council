import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes';
import { fetchMe } from './features/auth/authSlice';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMe());
    }
  }, [isAuthenticated, dispatch]);

  return <AppRoutes />;
}

export default App;
