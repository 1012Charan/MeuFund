import React from 'react';
import { useState } from 'react';
import AuthScreen from './components/AuthScreen.jsx';
import Dashboard from './components/Dashboard.jsx';
import StartupExplorer from './components/StartupExplorer.jsx';
import StartupManager from './components/StartupManager.jsx';
import { navigationFor } from './view-model.js';

function readSession() {
  try {
    return JSON.parse(window.localStorage.getItem('meufund-session'));
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(readSession);
  const [view, setView] = useState('Dashboard');
  const [notice, setNotice] = useState('');

  function signIn(nextSession) {
    window.localStorage.setItem('meufund-session', JSON.stringify(nextSession));
    setSession(nextSession);
    setView('Dashboard');
    setNotice('');
  }

  function signOut() {
    window.localStorage.removeItem('meufund-session');
    setSession(null);
    setNotice('');
  }

  if (!session?.user || !session?.token) {
    return <AuthScreen onAuthenticated={signIn} />;
  }

  const navigation = navigationFor(session.user.role);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setView('Dashboard'); }}>
          <span className="brand-mark">M</span>
          <span>meufund</span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              className={view === item ? 'nav-link active' : 'nav-link'}
              key={item}
              onClick={() => { setNotice(''); setView(item); }}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="account-menu">
          <span className="role-chip">{session.user.role}</span>
          <span className="account-name">{session.user.name}</span>
          <button className="text-button" onClick={signOut} type="button">Sign out</button>
        </div>
      </header>

      <main className="content-shell">
        {notice && <p className="notice" role="status">{notice}</p>}
        {view === 'Dashboard' && <Dashboard session={session} onNotice={setNotice} />}
        {view === 'Browse startups' && <StartupExplorer session={session} onNotice={setNotice} />}
        {view === 'My startups' && <StartupManager session={session} onNotice={setNotice} />}
      </main>
    </div>
  );
}
