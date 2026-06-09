const BASE = '/api';

// PIN management — stored in sessionStorage
let _pin = null;

export function loadPin() {
  _pin = sessionStorage.getItem('cwl_pin') || null;
  return _pin;
}

export function setPin(pin) {
  _pin = pin;
  sessionStorage.setItem('cwl_pin', pin);
}

export function clearPin() {
  _pin = null;
  sessionStorage.removeItem('cwl_pin');
}

function jsonHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (_pin) h['x-admin-pin'] = _pin;
  return h;
}

async function handleRes(res) {
  if (res.status === 401) {
    clearPin();
    throw new Error('401');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function auth(pin) {
  const res = await fetch(`${BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  return handleRes(res);
}

export async function fetchState() {
  const res = await fetch(`${BASE}/state`);
  return handleRes(res);
}

export async function addParticipant(participant) {
  const res = await fetch(`${BASE}/participants`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(participant),
  });
  return handleRes(res);
}

export async function deleteParticipant(id) {
  const res = await fetch(`${BASE}/participants/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: jsonHeaders(),
  });
  return handleRes(res);
}

export async function updateDay(participantId, day, dayData) {
  const res = await fetch(`${BASE}/day-data`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ participantId, day, ...dayData }),
  });
  return handleRes(res);
}

export async function reorderParticipants(ids) {
  const res = await fetch(`${BASE}/participants/order`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ ids }),
  });
  return handleRes(res);
}

export async function resetAll() {
  const res = await fetch(`${BASE}/state`, {
    method: 'DELETE',
    headers: jsonHeaders(),
  });
  return handleRes(res);
}
