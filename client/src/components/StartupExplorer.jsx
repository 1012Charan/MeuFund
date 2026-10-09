import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api.js';
import { formatFundingGoal } from '../view-model.js';

export default function StartupExplorer({ session, onNotice }) {
  const [query, setQuery] = useState('');
  const [startups, setStartups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const result = await apiRequest(`/startups?q=${encodeURIComponent(query)}`, { token: session.token });
        if (active) setStartups(result.startups);
      } catch (error) {
        onNotice(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    const timer = window.setTimeout(load, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [onNotice, query, session.token]);

  async function expressInterest() {
    if (!selected) return;
    setBusy(true);
    try {
      await apiRequest(`/interests/startups/${selected._id}`, { token: session.token, method: 'POST', body: { message } });
      setMessage('');
      onNotice(`Interest sent to ${selected.name}.`);
    } catch (error) {
      onNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Explore</p><h1>Startups to know</h1><p className="subtitle">Search the profiles founders have shared and tell them when one catches your attention.</p></div></div>
      <div className="toolbar"><input className="input search-input" aria-label="Search startups" onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, industry, stage, or location" value={query} /></div>
      {loading ? <div className="empty-state">Finding startups…</div> : startups.length === 0 ? <div className="empty-state">No startups matched that search. Try a different word.</div> : <div className="card-grid">
        {startups.map((startup) => <article className="startup-card" key={startup._id}>
          <p className="eyebrow">{startup.industry || 'Startup'}</p><h3>{startup.name}</h3>
          <p>{startup.description.length > 160 ? `${startup.description.slice(0, 157)}…` : startup.description}</p>
          <div className="meta-row"><span className="meta-pill">{startup.stage || 'Stage not set'}</span><span className="meta-pill">{startup.location || 'Location not set'}</span></div>
          <div className="card-footer"><span className="muted">Goal: {formatFundingGoal(startup.fundingGoal)}</span><button className="button secondary small" onClick={() => { setSelected(startup); setMessage(''); }} type="button">View profile</button></div>
        </article>)}
      </div>}
      {selected && <section className="panel detail-panel" aria-label={`${selected.name} profile`}>
        <div className="section-heading"><div><p className="eyebrow">Startup profile</p><h2>{selected.name}</h2></div><button className="text-button" onClick={() => setSelected(null)} type="button">Close</button></div>
        <p>{selected.description}</p>
        <div className="meta-row"><span className="meta-pill">{selected.industry || 'Industry not set'}</span><span className="meta-pill">{selected.stage || 'Stage not set'}</span><span className="meta-pill">{selected.location || 'Location not set'}</span><span className="meta-pill">Goal: {formatFundingGoal(selected.fundingGoal)}</span></div>
        <label className="field">Add a short note (optional)<textarea className="textarea" maxLength="1000" onChange={(event) => setMessage(event.target.value)} placeholder="Share why you are interested" value={message} /></label>
        <div className="form-actions"><button className="button" disabled={busy} onClick={expressInterest} type="button">{busy ? 'Sending…' : 'Express interest'}</button></div>
      </section>}
    </>
  );
}
