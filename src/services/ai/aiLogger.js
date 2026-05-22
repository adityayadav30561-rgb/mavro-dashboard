/**
 * aiLogger — lightweight in-process logger for AI requests.
 *
 * Purpose: capture provider, model, latency, token usage placeholders, status,
 * and error reasons so that observability tooling (Prometheus / Sentry / a
 * future AIUsage collection) can be wired without changing call-sites.
 *
 * For now this writes structured lines to stdout with `[ai]` prefix and keeps
 * a small in-memory ring buffer for the /api/ai/health endpoint.
 */
const RING_CAPACITY = 200;
const ring = [];

function push(entry) {
  ring.push(entry);
  if (ring.length > RING_CAPACITY) ring.shift();
}

function logRequest(entry) {
  const record = {
    ts: new Date().toISOString(),
    ...entry,
  };
  push(record);

  // Stdout in a single line so log aggregators can ingest easily.
  // Never log prompt bodies or raw responses by default — only metadata.
  // Add an opt-in (AI_LOG_BODIES=1) later if needed for local debugging.
  // eslint-disable-next-line no-console
  console.log(
    `[ai] ${record.status} provider=${record.provider} model=${record.model} ` +
      `latency=${record.latencyMs}ms tokens=${record.usage?.totalTokens ?? '–'} ` +
      `op=${record.op || 'generate'}${record.error ? ` error="${record.error}"` : ''}`
  );
}

function recent(limit = 25) {
  return ring.slice(-limit).reverse();
}

function snapshot() {
  const total = ring.length;
  let success = 0;
  let failure = 0;
  let totalLatency = 0;
  let totalTokens = 0;
  ring.forEach((r) => {
    if (r.status === 'ok') success += 1;
    else failure += 1;
    totalLatency += r.latencyMs || 0;
    totalTokens += r.usage?.totalTokens || 0;
  });
  return {
    total,
    success,
    failure,
    avgLatencyMs: total ? Math.round(totalLatency / total) : 0,
    tokensConsumed: totalTokens,
  };
}

module.exports = { logRequest, recent, snapshot };
