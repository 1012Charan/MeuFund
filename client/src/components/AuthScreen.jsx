import React, { useState } from 'react';
import { apiRequest } from '../api.js';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      onAuthenticated(await apiRequest(endpoint, { method: 'POST', body }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const registering = mode === 'register';

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <a className="brand" href="#home"><span className="brand-mark">M</span><span>meufund</span></a>
        <div className="auth-story-copy">
          <p className="eyebrow">A place to get started</p>
          <h1>Good ideas need the right backers.</h1>
          <p>Founders can put their startups in front of investors. Investors can find teams and follow up with a clear expression of interest.</p>
        </div>
        <span className="auth-story-foot">MeuFund · Founder and investor marketplace</span>
      </section>
      <section className="auth-side">
        <div className="auth-card">
          <p className="eyebrow">{registering ? 'Create your account' : 'Welcome back'}</p>
          <h2>{registering ? 'Join MeuFund' : 'Sign in'}</h2>
          <p>{registering ? 'Choose a role for this account: founder or investor.' : 'Sign in to continue to your workspace.'}</p>
          {error && <p className="error-message" role="alert">{error}</p>}
          <form className="auth-form" onSubmit={submit}>
            {registering && <label className="field">Your name<input className="input" autoComplete="name" name="name" required maxLength="80" /></label>}
            <label className="field">Email address<input className="input" autoComplete="email" type="email" name="email" required /></label>
            <label className="field">Password<input className="input" autoComplete={registering ? 'new-password' : 'current-password'} type="password" name="password" minLength="8" required /></label>
            {registering && <label className="field">I am joining as<select className="select" name="role" defaultValue="founder" required><option value="founder">Founder</option><option value="investor">Investor</option></select></label>}
            <button className="button" disabled={busy} type="submit">{busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button>
          </form>
          <p className="auth-switch">{registering ? 'Already have an account?' : 'New to MeuFund?'}{' '}
            <button onClick={() => { setError(''); setMode(registering ? 'login' : 'register'); }} type="button">{registering ? 'Sign in' : 'Create an account'}</button>
          </p>
        </div>
      </section>
    </main>
  );
}
