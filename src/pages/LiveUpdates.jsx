import { useState } from 'react';
import { PageHead } from '../components/ui/PageHead.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Radio, Send, MapPin } from '../components/ui/Icons.jsx';
import { loadData, saveData, uid } from '../utils/storage.js';
import { seedLiveUpdates, seedCategories } from '../data/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

const emptyEvent = { eventTitle: '', category: '', status: 'live', startedAt: new Date().toISOString().slice(0, 16), updates: [] };

export default function LiveUpdates() {
  const toast = useToast();
  const categories = loadData('categories', seedCategories);
  const [events, setEvents] = useState(() => loadData('liveUpdates', seedLiveUpdates));
  const [activeEvent, setActiveEvent] = useState(() => loadData('liveUpdates', seedLiveUpdates)[0] || null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [newUpdateType, setNewUpdateType] = useState('update');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [eventForm, setEventForm] = useState(emptyEvent);

  const persist = (list) => {
    setEvents(list);
    saveData('liveUpdates', list);
    if (activeEvent) {
      const updated = list.find((e) => e.id === activeEvent.id);
      if (updated) setActiveEvent(updated);
    }
  };

  const addUpdate = () => {
    if (!newUpdateText.trim() || !activeEvent) return;
    const update = { id: uid('u'), time: new Date().toISOString(), text: newUpdateText, type: newUpdateType, pinned: false };
    const updated = events.map((e) =>
      e.id === activeEvent.id ? { ...e, updates: [update, ...e.updates] } : e
    );
    persist(updated);
    setNewUpdateText('');
    toast.success('Update posted', 'Live update added to the ticker.');
  };

  const pinUpdate = (eventId, updateId) => {
    const updated = events.map((e) =>
      e.id === eventId
        ? { ...e, updates: e.updates.map((u) => ({ ...u, pinned: u.id === updateId ? !u.pinned : u.pinned })) }
        : e
    );
    persist(updated);
  };

  const deleteUpdate = (eventId, updateId) => {
    const updated = events.map((e) =>
      e.id === eventId ? { ...e, updates: e.updates.filter((u) => u.id !== updateId) } : e
    );
    persist(updated);
    toast.success('Update deleted', 'Live update removed.');
  };

  const createEvent = () => {
    const errs = {};
    if (!eventForm.eventTitle.trim()) return toast.error('Validation', 'Event title is required.');
    const event = { id: uid('live'), ...eventForm, startedAt: new Date(eventForm.startedAt).toISOString(), updates: [] };
    const updated = [event, ...events];
    persist(updated);
    setActiveEvent(event);
    setEventModalOpen(false);
    toast.success('Live event created', `"${event.eventTitle}" is now live.`);
  };

  const confirmDeleteEvent = () => {
    const updated = events.filter((e) => e.id !== deleteTarget.id);
    persist(updated);
    if (activeEvent?.id === deleteTarget.id) setActiveEvent(updated[0] || null);
    toast.success('Event deleted', `"${deleteTarget.eventTitle}" removed.`);
    setDeleteTarget(null);
  };

  const statusColor = { live: 'var(--red-500)', scheduled: 'var(--blue-500)', ended: 'var(--gray-500)' };
  const typeColors = { update: 'var(--blue-500)', milestone: 'var(--green-500)', alert: 'var(--red-500)' };

  return (
    <div>
      <PageHead
        eyebrow="Live Coverage"
        title="Live Updates"
        desc="Manage live event coverage with real-time update feed."
        actions={
          <button className="btn btn-primary" onClick={() => { setEventForm(emptyEvent); setEventModalOpen(true); }} style={{ background: 'var(--red-500)' }}>
            <Plus />New Live Event
          </button>
        }
      />

      <div className="two-col" style={{ alignItems: 'flex-start' }}>
        {/* Event list */}
        <div>
          <h3 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Events</h3>
          {events.length === 0 ? (
            <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--text-faint)' }}>No live events. Create one to begin.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map((e) => (
                <div
                  key={e.id}
                  className={`card card-pad ${activeEvent?.id === e.id ? 'active-event' : ''}`}
                  style={{ cursor: 'pointer', border: activeEvent?.id === e.id ? '2px solid var(--red-500)' : '1px solid var(--border)' }}
                  onClick={() => setActiveEvent(e)}
                >
                  <div className="flex-between">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[e.status], flex: 'none', animation: e.status === 'live' ? 'pulse 1.4s infinite' : 'none' }} />
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: statusColor[e.status], textTransform: 'uppercase' }}>{e.status}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.eventTitle}</div>
                      <div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>{e.category} · {e.updates.length} updates</div>
                    </div>
                    <span className="action-btn danger" onClick={(ev) => { ev.stopPropagation(); setDeleteTarget(e); }}><Trash2 /></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active event feed */}
        <div>
          {activeEvent ? (
            <div>
              {/* Header */}
              <div className="card card-pad" style={{ marginBottom: 14, borderLeft: '4px solid var(--red-500)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Radio style={{ width: 16, height: 16, color: 'var(--red-500)' }} />
                  <span style={{ fontWeight: 800, color: 'var(--red-500)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {activeEvent.status === 'live' ? '● LIVE' : activeEvent.status.toUpperCase()}
                  </span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{activeEvent.eventTitle}</h2>
                <div className="faint" style={{ fontSize: 12 }}>{activeEvent.category} · Started {new Date(activeEvent.startedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>

              {/* Add update */}
              <div className="card card-pad" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Post New Update</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {['update', 'milestone', 'alert'].map((t) => (
                    <button key={t} className={`btn btn-sm ${newUpdateType === t ? 'btn-primary' : 'btn-secondary'}`}
                      style={newUpdateType === t ? { background: typeColors[t] } : {}}
                      onClick={() => setNewUpdateType(t)}>
                      {t}
                    </button>
                  ))}
                </div>
                <textarea className="input" rows={3} value={newUpdateText} onChange={(e) => setNewUpdateText(e.target.value)} placeholder="Type your live update here…" style={{ marginBottom: 10 }} />
                <button className="btn btn-primary btn-block" onClick={addUpdate} style={{ background: 'var(--red-500)' }}>
                  <Send />Post Update
                </button>
              </div>

              {/* Updates feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeEvent.updates.length === 0 ? (
                  <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                    No updates yet. Post the first update above.
                  </div>
                ) : (
                  activeEvent.updates.map((u) => (
                    <div key={u.id} className="card card-pad" style={{ borderLeft: `3px solid ${typeColors[u.type]}`, background: u.pinned ? 'var(--surface-2)' : 'var(--surface)' }}>
                      <div className="flex-between" style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: typeColors[u.type], textTransform: 'uppercase' }}>{u.type}</span>
                          {u.pinned && <span style={{ fontSize: 10, background: 'var(--amber-100)', color: 'var(--amber-500)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>📌 PINNED</span>}
                          <span className="faint" style={{ fontSize: 11.5 }}>
                            {new Date(u.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="action-cell">
                          <button className="action-btn" title={u.pinned ? 'Unpin' : 'Pin'} onClick={() => pinUpdate(activeEvent.id, u.id)}>📌</button>
                          <span className="action-btn danger" onClick={() => deleteUpdate(activeEvent.id, u.id)}><Trash2 /></span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{u.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 40 }}>
              <Radio style={{ width: 40, height: 40, marginBottom: 12 }} />
              <div style={{ fontWeight: 700, marginBottom: 4 }}>No event selected</div>
              <div>Create or select a live event to start posting updates</div>
            </div>
          )}
        </div>
      </div>

      {/* Create event modal */}
      <Modal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title="Create Live Event"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEventModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createEvent} style={{ background: 'var(--red-500)' }}>Go Live</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Event Title *</label>
            <input className="input" value={eventForm.eventTitle} onChange={(e) => setEventForm({ ...eventForm, eventTitle: e.target.value })} placeholder="e.g. Election Results — Tamil Nadu 2026" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Category</label>
              <select className="select" value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select className="select" value={eventForm.status} onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}>
                <option value="live">Live</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Start Time</label>
            <input type="datetime-local" className="input" value={eventForm.startedAt} onChange={(e) => setEventForm({ ...eventForm, startedAt: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteEvent}
        title="Delete live event?"
        message={`"${deleteTarget?.eventTitle || ''}" and all ${deleteTarget?.updates?.length || 0} updates will be permanently removed.`}
      />
    </div>
  );
}
