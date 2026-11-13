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

  // 店舗キーがないとき：QRコードの撮影、または手入力で設定する
  function setupKey() {
    $('noToken').classList.remove('hide');
    const msg = (t, good) => { const m = $('keyMsg'); m.textContent = t; m.classList.remove('hide'); m.classList.toggle('good', !!good); };
    const apply = raw => {
      let t = String(raw || '').trim();
      const m = t.match(/[?&]s=([A-Za-z0-9]+)/);
      if (m) t = m[1];
      t = t.replace(/[^A-Za-z0-9]/g, '');
      if (t.length < 6) { msg('店舗キーが読み取れませんでした。もう一度お試しください。'); return; }
      ls.set(key, t);
      token = t;
      msg('設定できました。開いています…', true);
      if (standalone) setTimeout(openApp, 400);
      else location.replace('./?s=' + encodeURIComponent(t));
    };
    $('keyBtn').onclick = () => apply($('keyIn').value);
    $('keyIn').addEventListener('keydown', e => { if (e.key === 'Enter') apply($('keyIn').value); });
    if ('BarcodeDetector' in window) {
      $('scanBtn').classList.remove('hide');
      $('scanBtn').onclick = () => $('scanFile').click();
      $('scanFile').onchange = async e => {
        const f = e.target.files[0]; e.target.value = '';
        if (!f) return;
        msg('読み取り中…', true);
        try {
          const det = new BarcodeDetector({ formats: ['qr_code'] });
          const codes = await det.detect(await createImageBitmap(f));
          if (!codes.length) { msg('QRコードが見つかりませんでした。QRコードを大きく、はっきり写してください。'); return; }
          apply(codes[0].rawValue);
        } catch (err) { msg('この機種では撮影で読み取れません。下の欄に英数字を入力してください。'); }
      };
    }
  }

  function openApp() {
    document.body.innerHTML = '';
    const f = document.createElement('iframe');
    f.id = 'app';
    f.allow = 'camera; clipboard-write';
    f.src = window.NIKKEI_GAS_URL + '?s=' + encodeURIComponent(token) + '&app=1';
    document.body.appendChild(f);
  }

  if (!token) { setupKey(); return; }
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
