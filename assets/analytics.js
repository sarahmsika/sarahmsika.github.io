/* Basic consent mode: the Google tag is fetched only after consent. */
(() => {
  'use strict';
  const measurementId = 'G-WLYTP36GQV';
  const disableKey = `ga-disable-${measurementId}`;
  const storageKey = 'sarahmsika.analytics-consent.v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const banner = document.getElementById('cookie-banner');
  const settings = document.getElementById('cookie-settings');
  const accept = document.getElementById('cookie-accept');
  const reject = document.getElementById('cookie-reject');
  const close = document.getElementById('cookie-close');
  const current = document.getElementById('cookie-current');
  if (!banner || !settings || !accept || !reject || !close || !current) return;

  window[disableKey] = true;
  let choice = null;
  let expiresAt = 0;
  let expiryTimer;
  let script;
  let ready = false;
  let configured = false;
  let pageViewSent = false;
  let returnFocus = false;
  const denied = {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  };
  const gtag = function () { window.dataLayer.push(arguments); };

  function readChoice() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && ['accepted', 'rejected'].includes(saved.choice) &&
          Number.isFinite(saved.expiresAt) && saved.expiresAt > Date.now() &&
          saved.expiresAt <= Date.now() + lifetime) return saved;
    } catch (_) { /* Storage can be unavailable in private browsing. */ }
    return { choice: null, expiresAt: 0 };
  }

  function removeCookies() {
    for (const name of ['_ga', '_ga_WLYTP36GQV']) {
      for (const domain of ['', `; Domain=${location.hostname}`, '; Domain=sarahmsika.com']) {
        document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`;
      }
    }
  }

  function stopTracking() {
    window[disableKey] = true;
    if (window.dataLayer) gtag('consent', 'update', { ...denied });
    removeCookies();
  }

  function showPreferences(focus) {
    banner.hidden = false;
    close.hidden = !choice;
    current.hidden = !choice;
    current.textContent = choice === 'accepted' ? 'Votre choix actuel : mesure d’audience acceptée.' : 'Votre choix actuel : mesure d’audience refusée.';
    settings.setAttribute('aria-expanded', 'true');
    returnFocus = focus;
    if (focus) accept.focus();
  }

  function hidePreferences() {
    banner.hidden = true;
    settings.setAttribute('aria-expanded', 'false');
    if (returnFocus) settings.focus({ preventScroll: true });
    returnFocus = false;
  }

  function permitted() {
    if (choice === 'accepted' && expiresAt > Date.now()) return true;
    if (choice === 'accepted') expireChoice();
    return false;
  }

  function startTracking() {
    if (!ready || !permitted()) return;
    window[disableKey] = false;
    gtag('consent', 'update', { ...denied, analytics_storage: 'granted' });
    if (!configured) {
      let referrer = '';
      try { referrer = document.referrer ? new URL(document.referrer).origin + '/' : ''; } catch (_) {}
      gtag('js', new Date());
      gtag('config', measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_expires: lifetime / 1000,
        cookie_update: false,
        cookie_flags: 'SameSite=Lax;Secure',
        page_location: 'https://sarahmsika.com/',
        page_referrer: referrer,
        page_title: 'Sarah Msika | Maternité consciente et transmission'
      });
      configured = true;
    }
    if (!pageViewSent) {
      gtag('event', 'page_view', { send_to: measurementId });
      pageViewSent = true;
    }
  }

  function loadAnalytics() {
    if (!permitted()) return;
    if (ready) return startTracking();
    if (script) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = gtag;
    gtag('consent', 'default', { ...denied });
    gtag('set', { allow_google_signals: false, allow_ad_personalization_signals: false });
    script = document.createElement('script');
    script.async = true;
    script.referrerPolicy = 'strict-origin';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onload = () => { ready = true; startTracking(); };
    script.onerror = () => { script.remove(); script = null; };
    document.head.appendChild(script);
  }

  function expireChoice() {
    choice = null;
    expiresAt = 0;
    stopTracking();
    showPreferences(false);
  }

  function scheduleExpiry() {
    clearTimeout(expiryTimer);
    if (!choice) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return expireChoice();
    // Browsers cap timer delays at a signed 32-bit integer.
    expiryTimer = setTimeout(scheduleExpiry, Math.min(remaining, 2147483647));
  }

  function saveChoice(value) {
    choice = value;
    expiresAt = Date.now() + lifetime;
    try { localStorage.setItem(storageKey, JSON.stringify({ choice, expiresAt })); } catch (_) {}
    if (choice === 'accepted') loadAnalytics();
    else stopTracking();
    hidePreferences();
    scheduleExpiry();
  }

  function track(name, params = {}) {
    // No form values or unconsented events are queued for later transmission.
    if (!permitted() || !ready || !configured) return;
    gtag('event', name, { send_to: measurementId, ...params });
  }

  accept.addEventListener('click', () => saveChoice('accepted'));
  reject.addEventListener('click', () => saveChoice('rejected'));
  settings.addEventListener('click', () => showPreferences(true));
  close.addEventListener('click', hidePreferences);
  banner.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && choice) hidePreferences();
  });
  document.addEventListener('newsletter:success', () => track('newsletter_signup'));
  document.querySelectorAll('[data-book-link]').forEach((link) => {
    const destination = link.dataset.bookLink;
    if (!['amazon', 'coulisses'].includes(destination)) return;
    link.addEventListener('click', () => track('book_click', { destination }));
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    ({ choice, expiresAt } = readChoice());
    if (choice === 'accepted') loadAnalytics();
    else stopTracking();
    if (choice) hidePreferences();
    else showPreferences(false);
    scheduleExpiry();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleExpiry(); });
  ({ choice, expiresAt } = readChoice());
  settings.hidden = false;
  if (choice === 'accepted') loadAnalytics();
  else stopTracking();
  if (!choice) showPreferences(false);
  scheduleExpiry();
})();
