import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

/**
 * GoogleAuthCallback.jsx
 * 
 * This page handles the Google OAuth callback from Django Allauth.
 * After successful Google login, Django redirects here with an established session.
 * We detect the authenticated user and redirect to home.
 */
export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const { checkAuth, user, loading } = useAuth();
  const { refresh: refreshCart } = useCart();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Refresh auth state to detect the new session from Django Allauth
        console.log('[GoogleAuthCallback] Checking authentication after OAuth...');
        const authData = await checkAuth();
        
        // Small delay to ensure session is fully established
        await new Promise(r => setTimeout(r, 200));
        
        // Refresh cart with the new authenticated session
        if (authData?.user) {
          console.log('[GoogleAuthCallback] User authenticated, refreshing cart...');
          try {
            await refreshCart();
          } catch (e) {
            console.warn('[GoogleAuthCallback] Cart refresh failed (ok for first login):', e);
          }
        }

        // Redirect to home
        console.log('[GoogleAuthCallback] Redirecting to home');
        navigate('/');
      } catch (error) {
        console.error('[GoogleAuthCallback] Error:', error);
        navigate('/login?error=oauth_failed');
      }
    };

    if (!loading) {
      handleCallback();
    }
  }, [loading, navigate, checkAuth, refreshCart]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
        <h2>Completing Login...</h2>
        <p style={{ color: '#666' }}>Please wait while we complete your Google sign-in.</p>
      </div>
    </div>
  );
}
