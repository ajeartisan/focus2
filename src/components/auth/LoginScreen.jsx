import React from 'react';
import { signInWithGoogle, isSupabaseConfigured } from '../../lib/supabase.js';

export default function LoginScreen({ onSkip }) {
  const handleGoogle = async () => {
    if (!isSupabaseConfigured()) {
      alert('Supabase credentials not configured. Use "Continue without signing in" for now.');
      return;
    }
    const { error } = await signInWithGoogle();
    if (error) alert('Sign-in failed: ' + error.message);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">Focus2</h1>
        <p className="login-subtitle">Personal task dashboard</p>
        <button className="login-btn google-btn" onClick={handleGoogle}>
          Sign in with Google
        </button>
        <button className="login-btn skip-btn" onClick={onSkip}>
          Continue without signing in
        </button>
      </div>
    </div>
  );
}
