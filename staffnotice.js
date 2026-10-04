/* 오토핸즈 '오늘의 공지' 띠 (영업CRM · 관리자웹 · 직원웹 공용)
   · 로그인한 직원에게 오늘 볼 공지가 있으면 화면 맨 위에 '📢 오늘의 공지' 띠가 보여요
   · 띠를 누르면 공지 전체가 열리고, [확인했어요]를 누르면 읽음으로 기록돼요
   · 1분마다, 그리고 화면으로 돌아올 때마다 새 공지를 확인해요
   · 공지 쓰기는 관리자웹 [오늘의 공지] 탭에서 해요 (23_staff_notices.sql 필요) */
(function () {
  var URL_ = 'https://kkmmfbqiddirhbiqtqsu.supabase.co';
  var KEY = 'sb_publishable_4UNSE0BXfpI5lp4uc-ulxA_EqldYgh-';
  var AUTH_KEY = 'carwash-crm-auth';
  var list = [], open = false, bar, layer, busy = false, timer;

  var css = '' +
    '.snbar{display:none;font-family:"Noto Sans KR",system-ui,sans-serif;background:#FFF8E6;border-bottom:1px solid #E9D9A8;color:#3B2F0E}' +
    '.snbar.on{display:block}.snbar.unread{background:#C9A44C;border-color:#B08B33;color:#0C1422}' +
    '.snbar button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;width:100%;max-width:1180px;margin:0 auto;padding:9px 20px;font-size:13.5px;font-weight:700}' +
    '.snbar .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.snbar .c{background:#0C1422;color:#E2C77F;border-radius:999px;padding:1px 9px;font-size:12px;flex:none}' +
    '.snbar .m{flex:none;font-size:12.5px;text-decoration:underline;text-underline-offset:3px}' +
    '.snlayer{position:fixed;inset:0;z-index:95;background:rgba(12,20,34,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Noto Sans KR",system-ui,sans-serif}' +
    '.snbox{width:100%;max-width:520px;max-height:86vh;overflow:auto;background:#F7F5F0;border-radius:18px;padding:18px 16px 14px;box-shadow:0 20px 50px rgba(12,20,34,.35);color:#1B2433}' +
    '.snbox h2{margin:0 0 4px;font-size:18px}.snbox .sub{margin:0 0 12px;font-size:12.5px;color:#6B7280}' +
    '.snitem{background:#fff;border:1px solid #E4E0D6;border-radius:12px;padding:12px;margin-bottom:10px}' +
    '.snitem.imp{border-color:#C62828;box-shadow:0 0 0 2px #FDECEA}.snitem.new{border-left:4px solid #C9A44C}' +
    '.snitem b{font-size:15px}.snitem p{margin:6px 0 4px;white-space:pre-wrap;font-size:14px;line-height:1.55}' +
    '.snitem small{font-size:11.5px;color:#6B7280}.sntag{display:inline-block;font-size:11px;font-weight:800;padding:1px 7px;border-radius:999px;margin-right:6px;vertical-align:2px}' +
    '.sntag.r{background:#C62828;color:#fff}.sntag.n{background:#C9A44C;color:#0C1422}.sntag.d{background:#E6EAF2;color:#1D3A6E}' +
    '.snacts{display:flex;gap:8px;margin-top:6px}.snacts button{all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;min-height:44px;line-height:44px;border-radius:12px;font-weight:800;font-size:14px}' +
    '.snacts .ok{background:#0C1422;color:#E2C77F}.snacts .no{background:#fff;border:1px solid #D9D4C7;color:#1B2433}';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function token() {
    try { var j = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); if (j && j.access_token && (!j.expires_at || j.expires_at * 1000 > Date.now())) return j.access_token; } catch (_) {}
    return null;
  }
  function rpc(name, args) {
    var tk = token(); if (!tk) return Promise.resolve(null);
    return fetch(URL_ + '/rest/v1/rpc/' + name, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function when(ts) { var d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  var TG = { all: '전 직원', field: '현장직원', sales: '영업' };

  function build() {
    if (bar) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    bar = document.createElement('div'); bar.className = 'snbar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', '오늘의 공지');
    layer = document.createElement('div');
    var nav = document.querySelector('nav.appnav');
    if (nav && nav.parentNode === document.body) document.body.insertBefore(bar, nav.nextSibling); else document.body.insertBefore(bar, document.body.firstChild);
    document.body.appendChild(layer);
    bar.addEventListener('click', function () { open = true; draw(); });
    layer.addEventListener('click', function (e) {
      var a = e.target.closest('[data-sn]');
      if (!a) { if (e.target.classList.contains('snlayer')) { open = false; draw(); } return; }
      if (a.dataset.sn === 'close') { open = false; draw(); }
      if (a.dataset.sn === 'read' && !busy) {
        var ids = list.filter(function (n) { return !n.is_read; }).map(function (n) { return n.id; });
        busy = true;
        (ids.length ? rpc('mark_notices_read', { p_ids: ids }) : Promise.resolve()).then(function () {
          list.forEach(function (n) { n.is_read = true; }); busy = false; open = false; draw();
        });
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { open = false; draw(); } });
  }

  function draw() {
    if (!document.body) return;
    build();
    var unread = list.filter(function (n) { return !n.is_read; });
    if (!list.length) { bar.className = 'snbar'; bar.innerHTML = ''; layer.innerHTML = ''; return; }
    var top = unread[0] || list[0];
    bar.className = 'snbar on' + (unread.length ? ' unread' : '');
    bar.innerHTML = '<button type="button" aria-haspopup="dialog"><span>📢</span><span class="c">' + (unread.length ? '새 공지 ' + unread.length : '공지 ' + list.length) + '</span>' +
      '<span class="t">' + (top.important ? '[중요] ' : '') + esc(top.title || top.body) + '</span><span class="m">' + (unread.length ? '확인하기' : '다시 보기') + '</span></button>';
    if (!open) { layer.innerHTML = ''; return; }
    layer.innerHTML = '<div class="snlayer"><div class="snbox" role="dialog" aria-modal="true" aria-labelledby="sn-h"><h2 id="sn-h">📢 오늘의 공지</h2><p class="sub">총무 · 관리자가 올린 공지예요.</p>' +
      list.map(function (n) {
        return '<div class="snitem' + (n.important ? ' imp' : '') + (n.is_read ? '' : ' new') + '">' +
          (n.important ? '<span class="sntag r">중요</span>' : '') + (n.is_read ? '' : '<span class="sntag n">NEW</span>') + '<span class="sntag d">' + (TG[n.target] || '전 직원') + '</span>' +
          '<b>' + esc(n.title || '공지') + '</b>' + (n.body ? '<p>' + esc(n.body) + '</p>' : '') +
          '<small>' + esc(n.author || '관리자') + ' · ' + when(n.created_at) + (n.end_date && n.end_date !== n.start_date ? ' · ' + n.end_date.slice(5).replace('-', '/') + '까지' : '') + '</small></div>';
      }).join('') +
      '<div class="snacts"><button type="button" class="no" data-sn="close">닫기</button>' + (unread.length ? '<button type="button" class="ok" data-sn="read">확인했어요</button>' : '') + '</div></div></div>';
    var ok = layer.querySelector('[data-sn="read"]') || layer.querySelector('[data-sn="close"]'); if (ok) ok.focus();
  }

  function load() {
    if (document.visibilityState === 'hidden') return;
    if (!token()) { list = []; draw(); return; }
    rpc('list_today_notices').then(function (rows) {
      if (!Array.isArray(rows)) return;
      var before = list.filter(function (n) { return !n.is_read; }).length;
      list = rows; draw();
      // 새 공지가 생기면 바로 열어서 보여줘요 (처음 열 때 포함)
      var now = list.filter(function (n) { return !n.is_read; }).length;
      if (now > before && !open) { open = true; draw(); }
    });
  }

  function start() {
    draw(); load();
    clearInterval(timer); timer = setInterval(load, 60000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') load(); });
    window.addEventListener('storage', function (e) { if (e.key === AUTH_KEY) setTimeout(load, 500); });
    setTimeout(load, 4000);   // 로그인 직후 토큰이 저장되는 시간을 기다렸다가 한 번 더
  }
  window.StaffNotice = { reload: load };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
