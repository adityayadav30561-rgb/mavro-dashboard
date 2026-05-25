import api from '@/api/axios';
import { apiPath } from '@/lib/apiBase';

// ════════════════════════════════════════════════════════════════════════════
// Scheduler API client — Phase 1 scaffold
// ────────────────────────────────────────────────────────────────────────────
// Maps 1:1 onto backend /api/scheduler/* (JWT-protected) and /api/public/book*
// (unauthenticated). Reuses the central `api` axios instance so token interceptor
// + 401 redirect logic stay consistent with the rest of the admin frontend.
//
// Phase 1 ships only the call surface — hooks + UI integration land in Phase 2.
// Naming convention mirrors client/src/api/* so consumers feel natural.
// ════════════════════════════════════════════════════════════════════════════

// ----- EventTypes (admin) -----
export const listEventTypes = (params) => api.get('/scheduler/event-types', { params }).then((r) => r.data);
export const createEventType = (payload) => api.post('/scheduler/event-types', payload).then((r) => r.data);
export const getEventType = (id) => api.get(`/scheduler/event-types/${id}`).then((r) => r.data);
export const updateEventType = (id, payload) => api.put(`/scheduler/event-types/${id}`, payload).then((r) => r.data);
export const deleteEventType = (id) => api.delete(`/scheduler/event-types/${id}`).then((r) => r.data);
export const setEventTypeActive = (id, isActive) =>
  api.patch(`/scheduler/event-types/${id}/active`, { isActive }).then((r) => r.data);
export const duplicateEventType = (id) =>
  api.post(`/scheduler/event-types/${id}/duplicate`).then((r) => r.data);

// ----- FormQuestions (nested under event types) -----
export const listFormQuestions = (eventTypeId) =>
  api.get(`/scheduler/event-types/${eventTypeId}/questions`).then((r) => r.data);
export const createFormQuestion = (eventTypeId, payload) =>
  api.post(`/scheduler/event-types/${eventTypeId}/questions`, payload).then((r) => r.data);
export const updateFormQuestion = (eventTypeId, id, payload) =>
  api.put(`/scheduler/event-types/${eventTypeId}/questions/${id}`, payload).then((r) => r.data);
export const deleteFormQuestion = (eventTypeId, id) =>
  api.delete(`/scheduler/event-types/${eventTypeId}/questions/${id}`).then((r) => r.data);
export const reorderFormQuestions = (eventTypeId, order) =>
  api.put(`/scheduler/event-types/${eventTypeId}/questions/reorder`, { order }).then((r) => r.data);

// ----- Bookings (admin) -----
export const listBookings = (params) => api.get('/scheduler/bookings', { params }).then((r) => r.data);
export const getBooking = (id) => api.get(`/scheduler/bookings/${id}`).then((r) => r.data);
export const cancelBookingAdmin = (id, reason) =>
  api.post(`/scheduler/bookings/${id}/cancel`, { reason }).then((r) => r.data);

// ----- CalendarConnections (admin) -----
export const listCalendarConnections = (params) =>
  api.get('/scheduler/calendar-connections', { params }).then((r) => r.data);
export const getCalendarConnection = (id) =>
  api.get(`/scheduler/calendar-connections/${id}`).then((r) => r.data);
export const deleteCalendarConnection = (id) =>
  api.delete(`/scheduler/calendar-connections/${id}`).then((r) => r.data);

// ----- Workflows (admin) -----
export const listWorkflows = (params) => api.get('/scheduler/workflows', { params }).then((r) => r.data);
export const createWorkflow = (payload) => api.post('/scheduler/workflows', payload).then((r) => r.data);
export const getWorkflow = (id) => api.get(`/scheduler/workflows/${id}`).then((r) => r.data);
export const updateWorkflow = (id, payload) => api.put(`/scheduler/workflows/${id}`, payload).then((r) => r.data);
export const deleteWorkflow = (id) => api.delete(`/scheduler/workflows/${id}`).then((r) => r.data);

// ----- Routing Forms (admin) -----
export const listRoutingForms = (params) => api.get('/scheduler/routing-forms', { params }).then((r) => r.data);
export const createRoutingForm = (payload) => api.post('/scheduler/routing-forms', payload).then((r) => r.data);
export const getRoutingForm = (id) => api.get(`/scheduler/routing-forms/${id}`).then((r) => r.data);
export const updateRoutingForm = (id, payload) => api.put(`/scheduler/routing-forms/${id}`, payload).then((r) => r.data);
export const deleteRoutingForm = (id) => api.delete(`/scheduler/routing-forms/${id}`).then((r) => r.data);

// ----- Ops (executions, webhook deliveries, replay) -----
export const listExecutions = (params) => api.get('/scheduler/ops/executions', { params }).then((r) => r.data);
export const replayExecution = (id) => api.post(`/scheduler/ops/executions/${id}/replay`).then((r) => r.data);
export const listWebhookDeliveries = (params) => api.get('/scheduler/ops/webhook-deliveries', { params }).then((r) => r.data);
export const retryWebhookDelivery = (id) => api.post(`/scheduler/ops/webhook-deliveries/${id}/retry`).then((r) => r.data);
export const retryProvider = (bookingId) => api.post(`/scheduler/ops/bookings/${bookingId}/retry-provider`).then((r) => r.data);

// ----- Public routing -----
export async function fetchPublicRoutingForm(slug, tenantSlug) {
  const params = new URLSearchParams();
  if (tenantSlug) params.set('tenant', tenantSlug);
  const url = `${apiPath(`/api/public/routing/${slug}`)}${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Failed to load form: ${res.status}`);
  }
  return res.json();
}

export async function evaluatePublicRoutingForm(slug, tenantSlug, answers) {
  const params = new URLSearchParams();
  if (tenantSlug) params.set('tenant', tenantSlug);
  const url = `${apiPath(`/api/public/routing/${slug}/evaluate`)}${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Routing evaluation failed: ${res.status}`);
  return body;
}

// ----- Public booking surface -----
// Uses apiPath() directly + fetch so the public widget doesn't need the auth-aware
// axios instance. This lets the same module be embedded in standalone tenant
// frontends (Spanbix, HRMS) without dragging in the admin token interceptor.
export async function fetchPublicEventType(tenantSlug, eventSlug) {
  const url = apiPath(`/api/public/book/${tenantSlug}/${eventSlug}`);
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`Failed to load event type: ${res.status}`);
  return res.json();
}

export async function fetchPublicSlots(tenantSlug, eventSlug, { start, end, timezone }) {
  const params = new URLSearchParams({
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
  });
  if (timezone) params.set('timezone', timezone);
  const url = `${apiPath(`/api/public/book/${tenantSlug}/${eventSlug}/slots`)}?${params.toString()}`;
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to load slots: ${res.status}`);
  }
  return res.json();
}

export async function createPublicBooking(tenantSlug, eventSlug, payload) {
  const url = apiPath(`/api/public/book/${tenantSlug}/${eventSlug}`);
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || `Failed to create booking: ${res.status}`);
    err.code = body.code || null;
    err.status = res.status;
    throw err;
  }
  return body;
}

export function icsDownloadUrl(cancelToken) {
  return apiPath(`/api/public/bookings/${cancelToken}/ics`);
}

export async function resolveBookingByToken(token) {
  const url = apiPath(`/api/public/bookings/${token}`);
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`Invalid or expired token: ${res.status}`);
  return res.json();
}

export async function cancelBookingByToken(token, reason = '') {
  const url = apiPath(`/api/public/bookings/${token}/cancel`);
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || 'Cancel failed');
    err.code = body.code || null;
    throw err;
  }
  return body;
}

export async function rescheduleBookingByToken(token, { startUtc, endUtc, hash }) {
  const url = apiPath(`/api/public/bookings/${token}/reschedule`);
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startUtc, endUtc, hash }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || 'Reschedule failed');
    err.code = body.code || null;
    throw err;
  }
  return body;
}
