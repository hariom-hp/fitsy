// Proxies a neural virtual try-on request to the Modal serverless GPU endpoint.
// The Modal URL + shared secret stay server-side (never reach the browser).
// A missing URL or any failure throws, so the controller can answer 503 and the
// frontend falls back to the geometric warp instead of hard-failing.

// Modal cold start (loading 9B weights onto L40S GPU) can take 2-3 minutes on first boot.
const TIMEOUT_MS = 300000; // 5 minutes timeout for cold boot resilience

/**
 * @param {Object} payload
 * @param {string} payload.human    - base64 data-URL of the user photo
 * @param {string} payload.garment  - base64 data-URL of the garment image
 * @param {string} payload.category - 'upper_body' | 'lower_body'
 * @returns {Promise<{image: string}>} base64 data-URL of the generated try-on
 */
async function generateTryOn({ human, garment, category }) {
  const rawUrl = process.env.MODAL_VTON_URL;
  if (!rawUrl) {
    throw new Error('Neural try-on engine is not configured (MODAL_VTON_URL unset).');
  }

  const url = rawUrl.endsWith('/generate') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/generate`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const secret = process.env.MODAL_VTON_SECRET;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ human, garment, category, secret }),
      signal: controller.signal,
    });

    // Parse manually: a crashed container or gateway can return an HTML/empty
    // body, and response.json() would throw an opaque SyntaxError.
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        `Modal returned non-JSON (HTTP ${response.status}): ${raw.slice(0, 160) || '<empty response>'}`
      );
    }

    if (!response.ok || !data.image) {
      throw new Error(data.error || data.message || `Modal try-on failed (HTTP ${response.status}).`);
    }

    return { image: data.image };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Neural try-on timed out (Modal cold start or overload).');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { generateTryOn };
