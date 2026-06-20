import { useContext } from 'react';
import { useAuth as useAuthFromContext } from '../context/AuthContext';

export default function useAuth() {
  return useAuthFromContext();
}



