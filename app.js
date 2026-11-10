(function () {
  const cfg = window.NIKKEI_STORE;              // 店舗ごとの index.html で設定
  const $ = id => document.getElementById(id);
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const q = new URLSearchParams(location.search);
  const key = 'nikkei_token_' + cfg.id;
  let token = (q.get('s') || '').replace(/[^A-Za-z0-9]/g, '');
  if (token) ls.set(key, token); else token = ls.get(key) || '';

  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js', { scope: './' }).catch(() => {});

  function openApp() {
    document.body.innerHTML = '';
    const f = document.createElement('iframe');
    f.id = 'app';
    f.allow = 'camera; clipboard-write';
    f.src = window.NIKKEI_GAS_URL + '?s=' + encodeURIComponent(token) + '&app=1';
    document.body.appendChild(f);
  }

  if (!token) { $('noToken').classList.remove('hide'); return; }
  if (standalone) { openApp(); return; }

  // ---- インストール画面 ----
  $('setup').classList.remove('hide');
  $('later').onclick = openApp;
  let deferred = null;

  if (ios) {
    $('ios').classList.remove('hide');
    $('arrow').classList.remove('hide');
    return;
  }
  $('android').classList.remove('hide');
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    $('installBtn').disabled = false;
  });
  window.addEventListener('appinstalled', () => {
    $('android').classList.add('hide');
    $('done').classList.remove('hide');
  });
  $('installBtn').onclick = async () => {
    if (!deferred) { $('manual').classList.remove('hide'); return; }
    deferred.prompt();
    const r = await deferred.userChoice;
    deferred = null;
    if (r.outcome === 'accepted') { $('android').classList.add('hide'); $('done').classList.remove('hide'); }
  };
  // 数秒たっても自動のボタンが使えない機種向けに手順も出す
  setTimeout(() => { if (!deferred) $('manual').classList.remove('hide'); }, 4000);
})();
