// src/components/RequireAuth.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { verifyToken } from '../lib/auth';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const validate = async () => {
      const token = localStorage.getItem('token');
      const tokenType = localStorage.getItem('tokenType') || '';

      if (!token) {
        setValid(false);
        setLoading(false);
        return;
      }

      try {
        const res = await verifyToken(token, tokenType);
        if (res?.isLogin) {
          setValid(true);
        } else {
          setValid(false);
        }
      } catch (e) {
        console.error('Token check failed:', e);
        setValid(false);
      }
      setLoading(false);
    };

    validate();
  }, []);

  if (loading) return null; // Or a spinner/loading indicator

  return valid ? children : <Navigate to="/login" replace state={{ from: location }} />;
};

export default RequireAuth;
