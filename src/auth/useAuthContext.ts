import { useContext } from 'react';
//import { AuthContext } from './providers/JWTProvider';
import { AuthContext } from './providers/AuthProviderV2';

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) throw new Error('useAuthContext must be used within AuthProviderV2');

  return context;
};
