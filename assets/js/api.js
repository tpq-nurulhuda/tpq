/**
 * api.js - Centralized API Client untuk Google Apps Script Web App
 * Mendukung: Request Deduplication, Public Caching, Timeout, dan Auth Session Header
 * Portal Digital TPQ Nurul Huda
 */
(function (global) {
  'use strict';

  var SESSION_STORAGE_KEY = 'tpq_nh_session_v1';
  var CACHE_PREFIX = 'tpq_nh_pubcache_';
  var inFlightMap = {};

  function getBaseUrl() {
    var url = (global.TPQ_CONFIG && global.TPQ_CONFIG.API_BASE_URL) || '';
    if (!url || url.indexOf('REPLACE_WITH_YOUR_GAS_WEBAPP_ID') !== -1) {
      return '';
    }
    return url;
  }

  function getSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(sess) {
    try {
      if (sess) sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sess));
      else sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {}
  }

  function getToken() {
    var s = getSession();
    return s && s.token ? s.token : '';
  }

  function getPublicCache(key) {
    try {
      var raw = sessionStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      var ttl = (global.TPQ_CONFIG && global.TPQ_CONFIG.CACHE_TTL_MS) || 300000;
      if (Date.now() - parsed.ts > ttl) {
        sessionStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  function setPublicCache(key, data) {
    try {
      sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {}
  }

  function clearPublicCache() {
    try {
      var keys = [];
      for (var i = 0; i < sessionStorage.length; i++) {
        var k = sessionStorage.key(i);
        if (k && k.indexOf(CACHE_PREFIX) === 0) keys.push(k);
      }
      keys.forEach(function (k) { sessionStorage.removeItem(k); });
    } catch (e) {}
  }

  /**
   * Panggil endpoint Google Apps Script.
   * @param {string} action - Nama action endpoint GAS
   * @param {object} payload - Parameter request
   * @param {object} opts - { useCache: boolean, requireAuth: boolean }
   */
  function request(action, payload, opts) {
    opts = opts || {};
    payload = payload || {};
    var baseUrl = getBaseUrl();

    if (!baseUrl) {
      return Promise.reject({
        code: 503,
        message: 'URL Backend Google Apps Script belum dikonfigurasi pada assets/js/config.js.'
      });
    }

    var isPublicRead = Boolean(opts.useCache);
    var cacheKey = action + '_' + JSON.stringify(payload);

    if (isPublicRead) {
      var cached = getPublicCache(cacheKey);
      if (cached !== null) {
        return Promise.resolve(cached);
      }
    }

    // Cegah request identik ganda yang sedang berjalan (in-flight deduplication)
    var flightKey = action + '::' + JSON.stringify(payload);
    if (inFlightMap[flightKey]) {
      return inFlightMap[flightKey];
    }

    var token = opts.requireAuth ? getToken() : (opts.includeToken ? getToken() : '');
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutMs = (global.TPQ_CONFIG && global.TPQ_CONFIG.REQUEST_TIMEOUT_MS) || 25000;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;

    var fetchPromise;
    if (isPublicRead && !token) {
      // Gunakan GET untuk endpoint publik agar ringan & tidak kena preflight
      var qs = new URLSearchParams();
      qs.set('action', action);
      Object.keys(payload).forEach(function (k) {
        if (payload[k] !== undefined && payload[k] !== null && payload[k] !== '') {
          qs.set(k, String(payload[k]));
        }
      });
      fetchPromise = fetch(baseUrl + '?' + qs.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller ? controller.signal : undefined
      });
    } else {
      // Gunakan POST text/plain agar kompatibel dengan GAS Web App tanpa CORS preflight error
      fetchPromise = fetch(baseUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, token: token, payload: payload }),
        signal: controller ? controller.signal : undefined
      });
    }

    var wrapped = fetchPromise
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) {
          throw { code: res.status, message: 'Server merespons dengan status ' + res.status };
        }
        return res.json();
      })
      .then(function (json) {
        if (!json || json.success !== true) {
          var code = (json && json.code) || 400;
          if (code === 401) {
            setSession(null);
          }
          throw { code: code, message: (json && json.message) || 'Permintaan gagal diproses.' };
        }
        if (isPublicRead) {
          setPublicCache(cacheKey, json.data);
        } else if (action.indexOf('_save') !== -1 || action.indexOf('_delete') !== -1 || action.indexOf('_update') !== -1 || action.indexOf('_import') !== -1 || action.indexOf('_set_') !== -1 || action.indexOf('_add_') !== -1) {
          clearPublicCache();
        }
        return json.data;
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        if (err && err.name === 'AbortError') {
          throw { code: 408, message: 'Permintaan melebihi batas waktu. Periksa koneksi internet Anda.' };
        }
        if (err && err.message) throw err;
        throw { code: 0, message: 'Tidak dapat terhubung ke server backend.' };
      })
      .finally(function () {
        delete inFlightMap[flightKey];
      });

    inFlightMap[flightKey] = wrapped;
    return wrapped;
  }

  global.TPQApi = {
    request: request,
    getSession: getSession,
    setSession: setSession,
    getToken: getToken,
    clearPublicCache: clearPublicCache
  };
})(window);
