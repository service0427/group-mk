import { useContext } from 'react';
//import { AuthContext } from './providers/JWTProvider';
import { AuthContext } from './providers/AuthProvider';

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  console.log(context);

  if (!context) throw new Error('useAuthContext must be used within AuthProvider');

  return context;
};
