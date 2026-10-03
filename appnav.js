/* 오토핸즈 앱 이동 바 (관리자 앱 · 직원 앱 공용)
   PC(701px 이상): 화면 맨 위 가로 바 / 휴대폰: 화면 맨 아래 탭바
   사용법: AppNav.set('admin', true)  → 현재 앱 표시 + 바 보이기
           AppNav.set('field', false) → 바 숨기기 (일반 현장직원 등) */
(function () {
  var APPS = [
    { key: 'customer', label: '고객앱', href: 'https://autohands-web.vercel.app/app', ext: true,
      icon: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>' },
    { key: 'admin', label: '관리자앱', href: '/admin',
      icon: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>' },
    { key: 'field', label: '직원앱', href: '/field',
      icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>' }
  ];

  var css = '' +
    '.appnav{display:none;font-family:"Noto Sans KR",system-ui,sans-serif}' +
    'body.has-appnav .appnav{display:block}' +
    '.appnav ul{list-style:none;margin:0;padding:0;display:flex}' +
    '.appnav li{flex:1}' +
    '.appnav a{display:flex;align-items:center;justify-content:center;gap:7px;text-decoration:none;font-weight:700;color:#AEB6C4;-webkit-tap-highlight-color:transparent}' +
    '.appnav a[aria-current="page"]{color:#E2C77F}' +
    '.appnav svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}' +
    '.appnav .ext{font-size:10px;opacity:.7;margin-left:-3px}' +
    /* PC: 맨 위 가로 바 */
    '@media (min-width:701px){' +
      '.appnav{background:#060B14;border-bottom:1px solid rgba(255,255,255,.08)}' +
      '.appnav ul{max-width:1180px;margin:0 auto;padding:0 20px;justify-content:flex-start;gap:4px}' +
      '.appnav li{flex:none}' +
      '.appnav a{font-size:13px;padding:9px 14px;border-bottom:2px solid transparent}' +
      '.appnav a:hover{color:#fff}' +
      '.appnav a[aria-current="page"]{border-bottom-color:#C9A44C}' +
    '}' +
    /* 휴대폰: 맨 아래 탭바 */
    '@media (max-width:700px){' +
      '.appnav{position:fixed;left:0;right:0;bottom:0;z-index:40;background:#0C1422;border-top:1px solid rgba(255,255,255,.1);padding-bottom:env(safe-area-inset-bottom,0px)}' +
      '.appnav a{flex-direction:column;gap:3px;font-size:11.5px;min-height:58px;padding:6px 4px}' +
      '.appnav svg{width:22px;height:22px}' +
      '.appnav .ext{display:none}' +
      'body.has-appnav{padding-bottom:calc(60px + env(safe-area-inset-bottom,0px))}' +
      'body.has-appnav .toast{bottom:calc(72px + env(safe-area-inset-bottom,0px))}' +
    '}';

  var nav, current = '', visible = false;

  function build() {
    if (nav) return;
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    nav = document.createElement('nav');
    nav.className = 'appnav';
    nav.setAttribute('aria-label', '앱 이동');
    document.body.insertBefore(nav, document.body.firstChild);
  }

  function draw() {
    build();
    nav.innerHTML = '<ul>' + APPS.map(function (a) {
      var cur = a.key === current;
      return '<li><a href="' + a.href + '"' +
        (cur ? ' aria-current="page"' : '') +
        (a.ext ? ' target="_blank" rel="noopener"' : '') +
        ' data-appnav="' + a.key + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + a.icon + '</svg>' +
        '<span>' + a.label + '</span>' +
        (a.ext ? '<span class="ext" aria-label="새 창">↗</span>' : '') +
        '</a></li>';
    }).join('') + '</ul>';
    document.body.classList.toggle('has-appnav', visible);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-appnav]');
    if (!a) return;
    // 지금 보고 있는 앱을 다시 누르면 맨 위로만 올려요
    if (a.dataset.appnav === current) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    // 같은 회사 주소(관리자·직원)는 지금 창 안에서 이동 → 바에서 언제든 다시 돌아올 수 있어요
    if (!a.target) { e.preventDefault(); location.assign(a.getAttribute('href')); }
  });

  window.AppNav = {
    set: function (cur, show) {
      if (cur === current && !!show === visible && nav) return;
      current = cur; visible = !!show;
      if (document.body) draw();
      else document.addEventListener('DOMContentLoaded', draw);
    }
  };
})();
