/*
 * NeuroLearn-X — API client. Same-origin JSON with the X-NLX header the
 * server requires on every state-changing request.
 */
(function (root) {
  'use strict';
  class ApiError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }
  async function call(method, url, body) {
    const opts = { method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (method !== 'GET') {
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['X-NLX'] = '1';
      opts.body = JSON.stringify(body || {});
    }
    let res;
    try { res = await fetch(url, opts); } catch (e) { throw new ApiError(0, 'Cannot reach the NeuroLearn-X server. Check your connection.'); }
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if (!res.ok) throw new ApiError(res.status, data.error || `Request failed (${res.status}).`);
    return data;
  }
  root.NLX = Object.assign(root.NLX || {}, {
    api: {
      ApiError,
      get: url => call('GET', url),
      post: (url, body) => call('POST', url, body),
      patch: (url, body) => call('PATCH', url, body),
      put: (url, body) => call('PUT', url, body),
      del: url => call('DELETE', url)
    }
  });
})(typeof self !== 'undefined' ? self : this);
