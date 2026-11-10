// インストール（ホーム画面への追加）を有効にするための最小のサービスワーカー。キャッシュはしない
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
