// Pequeño wrapper sobre fetch para el backend Express + SQLite

const BASE = '/api';

async function handleRes(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchState() {
  const res = await fetch(`${BASE}/state`);
  return handleRes(res);
}

export async function addParticipant(participant) {
  const res = await fetch(`${BASE}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(participant),
  });
  return handleRes(res);
}

export async function deleteParticipant(id) {
  const res = await fetch(`${BASE}/participants/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return handleRes(res);
}

export async function updateDay(participantId, day, dayData) {
  const res = await fetch(`${BASE}/day-data`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantId, day, ...dayData }),
  });
  return handleRes(res);
}

export async function reorderParticipants(ids) {
  const res = await fetch(`${BASE}/participants/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  return handleRes(res);
}

export async function resetAll() {
  const res = await fetch(`${BASE}/state`, { method: 'DELETE' });
  return handleRes(res);
}
