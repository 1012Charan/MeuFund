import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api.js';
import { formatFundingGoal } from '../view-model.js';

const emptyStartup = { name: '', description: '', industry: '', location: '', stage: '', fundingGoal: '' };

function StartupForm({ startup, session, onSaved, onCancel }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (values.fundingGoal === '') delete values.fundingGoal;
    try {
      const result = await apiRequest(startup ? `/startups/${startup._id}` : '/startups', {
        token: session.token,
        method: startup ? 'PATCH' : 'POST',
        body: values,
      });
      onSaved(result.startup);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const value = startup ?? emptyStartup;
  return (
    <form className="panel" onSubmit={submit}>
      <div className="section-heading"><div><p className="eyebrow">{startup ? 'Edit profile' : 'New profile'}</p><h2>{startup ? startup.name : 'Tell investors about your startup'}</h2></div></div>
      {error && <p className="error-message" role="alert">{error}</p>}
      <div className="form-grid">
        <label className="field">Startup name<input className="input" defaultValue={value.name} maxLength="100" name="name" required /></label>
        <label className="field">Industry<input className="input" defaultValue={value.industry} maxLength="80" name="industry" placeholder="e.g. Climate tech" /></label>
        <label className="field wide">Description<textarea className="textarea" defaultValue={value.description} maxLength="3000" name="description" required /></label>
        <label className="field">Location<input className="input" defaultValue={value.location} maxLength="120" name="location" placeholder="City or remote" /></label>
        <label className="field">Stage<input className="input" defaultValue={value.stage} maxLength="80" name="stage" placeholder="e.g. Pre-seed" /></label>
        <label className="field">Funding goal (USD)<input className="input" defaultValue={value.fundingGoal ?? ''} min="0" name="fundingGoal" placeholder="Optional" step="1" type="number" /></label>
      </div>
      <div className="form-actions"><button className="button" disabled={busy} type="submit">{busy ? 'Saving…' : startup ? 'Save changes' : 'Create startup'}</button>{startup && <button className="button secondary" onClick={onCancel} type="button">Cancel</button>}</div>
    </form>
  );
}

export default function StartupManager({ session, onNotice }) {
  const [startups, setStartups] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest('/startups/mine', { token: session.token })
      .then(({ startups: owned }) => { if (active) setStartups(owned); })
      .catch((error) => onNotice(error.message))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [onNotice, session.token]);

  function save(startup) {
    setStartups((items) => {
      const exists = items.some((item) => item._id === startup._id);
      return exists ? items.map((item) => item._id === startup._id ? startup : item) : [startup, ...items];
    });
    setEditing(null);
    setCreating(false);
    onNotice('Startup profile saved. It is now visible to investors.');
  }

  if (creating || editing) return <StartupForm key={editing?._id ?? 'new'} startup={editing} session={session} onSaved={save} onCancel={() => { setEditing(null); setCreating(false); }} />;
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Founder workspace</p><h1>My startups</h1><p className="subtitle">Create a profile or keep the details on your current startups up to date. New profiles are visible to investors straight away.</p></div><button className="button" onClick={() => setCreating(true)} type="button">Add a startup</button></div>
      {loading ? <div className="empty-state">Loading your startups…</div> : startups.length === 0 ? <div className="empty-state">You have not added a startup yet. Create a profile to make it visible to investors.</div> : <div className="card-grid">
        {startups.map((startup) => <article className="startup-card" key={startup._id}>
          <p className="eyebrow">{startup.industry || 'Startup'}</p><h3>{startup.name}</h3><p>{startup.description}</p>
          <div className="meta-row"><span className="meta-pill">{startup.stage || 'Stage not set'}</span><span className="meta-pill">{startup.location || 'Location not set'}</span></div>
          <div className="card-footer"><span className="muted">Goal: {formatFundingGoal(startup.fundingGoal)}</span><button className="button secondary small" onClick={() => setEditing(startup)} type="button">Edit profile</button></div>
        </article>)}
      </div>}
    </>
  );
}
