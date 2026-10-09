import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api.js';
import { formatFundingGoal, statusLabel } from '../view-model.js';

export default function Dashboard({ session, onNotice }) {
  const [startups, setStartups] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const founder = session.user.role === 'founder';

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [startupResult, interestResult] = await Promise.all([
          founder ? apiRequest('/startups/mine', { token: session.token }) : Promise.resolve({ startups: [] }),
          apiRequest(founder ? '/interests/received' : '/interests/sent', { token: session.token }),
        ]);
        if (!active) return;
        setStartups(startupResult.startups);
        setInterests(interestResult.interests);
      } catch (error) {
        onNotice(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [founder, onNotice, session.token]);

  async function respond(interestId, status) {
    try {
      const result = await apiRequest(`/interests/${interestId}/respond`, {
        token: session.token,
        method: 'PATCH',
        body: { status },
      });
      setInterests((items) => items.map((item) => item._id === interestId
        ? { ...item, status: result.interest.status }
        : item));
      onNotice(`Interest ${status}.`);
    } catch (error) {
      onNotice(error.message);
    }
  }

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Your workspace</p><h1>Good to see you, {session.user.name.split(' ')[0]}.</h1><p className="subtitle">{founder ? 'Keep your startup details current and review the investors who have reached out.' : 'Browse startups and keep track of the interests you have shared.'}</p></div></div>
      <div className="card-grid">
        {founder && <article className="stat-card"><p className="stat-label">Your startups</p><p className="stat-value">{loading ? '—' : startups.length}</p></article>}
        <article className="stat-card"><p className="stat-label">{founder ? 'Investor interests' : 'Your interests'}</p><p className="stat-value">{loading ? '—' : interests.length}</p></article>
        <article className="stat-card"><p className="stat-label">Awaiting a response</p><p className="stat-value">{loading ? '—' : interests.filter((item) => item.status === 'pending').length}</p></article>
      </div>
      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Latest activity</p><h2>{founder ? 'Investor interest' : 'Your interest'}</h2></div></div>
        {loading ? <div className="empty-state">Loading your activity…</div> : interests.length === 0 ? (
          <div className="empty-state">{founder ? 'When an investor is interested in one of your startups, it will show up here.' : 'You have not expressed interest in a startup yet.'}</div>
        ) : <div className="panel interest-list">
          {interests.map((interest) => (
            <div className="interest-row" key={interest._id}>
              <div className="interest-copy"><strong>{founder ? interest.investor?.name : interest.startup?.name}</strong><p>{founder ? `${interest.startup?.name ?? 'Your startup'} · ${interest.message || 'No note included'}` : `Submitted ${new Date(interest.createdAt).toLocaleDateString()}`}</p></div>
              <div className="interest-actions"><span className={`status ${interest.status}`}>{statusLabel(interest.status)}</span>
                {founder && interest.status === 'pending' && <><button className="button small" onClick={() => respond(interest._id, 'accepted')} type="button">Accept</button><button className="button secondary small" onClick={() => respond(interest._id, 'declined')} type="button">Decline</button></>}
              </div>
            </div>
          ))}
        </div>}
      </section>
      {founder && startups.length > 0 && <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Your portfolio</p><h2>Startup profiles</h2></div></div>
        <div className="card-grid">{startups.slice(0, 3).map((startup) => <article className="startup-card" key={startup._id}><h3>{startup.name}</h3><p>{startup.description}</p><div className="meta-row"><span className="meta-pill">{startup.industry || 'Industry not set'}</span><span className="meta-pill">{formatFundingGoal(startup.fundingGoal)}</span></div></article>)}</div>
      </section>}
    </>
  );
}
