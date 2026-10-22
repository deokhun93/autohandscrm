/* 오토핸즈 '내 정보 수정' 창 (영업CRM · 관리자웹 · 직원웹 공용)
   · 가입한 직원 · 관리자가 자기 이름 · 휴대폰 · 생년월일 · 은행 · 계좌번호 · 집주소를 고쳐요
   · 비밀번호도 여기서 바꿀 수 있어요 (비워 두면 그대로)
   · 권한(관리자/직원)과 승인 상태는 바꿀 수 없어요 (DB에서 막혀 있어요)
   사용법: MyInfo.open() */
(function () {
  var URL_ = 'https://kkmmfbqiddirhbiqtqsu.supabase.co';
  var KEY = 'sb_publishable_4UNSE0BXfpI5lp4uc-ulxA_EqldYgh-';
  var AUTH_KEY = 'carwash-crm-auth';
  var FIELDS = 'name,phone,birth,bank,account,address';
  var layer = null, busy = false;

  function EN() { try { return location.pathname.indexOf('/field') === 0 && localStorage.getItem('ah-field-lang') === 'en'; } catch (_) { return false; } }
  function T(ko, en) { return EN() ? en : ko; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sess() {
    try { var j = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); if (j && j.access_token && j.user && (!j.expires_at || j.expires_at * 1000 > Date.now())) return j; } catch (_) {}
    return null;
  }
  function hdr(s, extra) { var h = { apikey: KEY, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' }; for (var k in (extra || {})) h[k] = extra[k]; return h; }
  function fmtPhone(v) {
    var d = String(v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + '-' + d.slice(3);
    return d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4);
  }

  var css = '' +
    '.milayer{position:fixed;inset:0;z-index:96;background:rgba(12,20,34,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Noto Sans KR",system-ui,sans-serif}' +
    '.mibox{width:100%;max-width:460px;max-height:90vh;overflow:auto;background:#F7F5F0;border-radius:18px;padding:18px 16px 14px;box-shadow:0 20px 50px rgba(12,20,34,.35);color:#1B2433}' +
    '.mibox h2{margin:0 0 4px;font-size:18px}.mibox .sub{margin:0 0 12px;font-size:12.5px;color:#6B7280}' +
    '.mibox label{display:block;font-size:12.5px;font-weight:700;color:#4B5563;margin:10px 0 4px}' +
    '.mibox input{box-sizing:border-box;width:100%;border:1px solid #DAD6CC;background:#fff;border-radius:10px;padding:10px 12px;font-size:15px;color:#1B2433;font-family:inherit}' +
    '.mibox input[readonly]{background:#EEEBE4;color:#6B7280}' +
    '.mibox .two{display:flex;gap:8px}.mibox .two>div{flex:1;min-width:0}' +
    '.mibox .addr{display:flex;gap:6px}.mibox .addr input{flex:1;min-width:0}' +
    '.mibox .sec{margin:16px 0 0;padding-top:12px;border-top:1px dashed #D5D0C4;font-size:13px;font-weight:800}' +
    '.mibox .err{margin:10px 0 0;color:#B4321E;font-size:13px;font-weight:700}' +
    '.mibox .row{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}' +
    '.mibox button{all:unset;box-sizing:border-box;cursor:pointer;border-radius:10px;padding:10px 16px;font-size:14px;font-weight:800;text-align:center}' +
    '.mibox .ghost{border:1px solid #CFCAC0;background:#fff;color:#1B2433}.mibox .go{background:#0C1422;color:#E2C77F}' +
    '.mibox .sm{padding:9px 12px;font-size:13px;background:#2A362E;color:#fff;white-space:nowrap}' +
    '.mibox button[disabled]{opacity:.5;cursor:default}' +
    '.mitoast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:97;background:#0C1422;color:#fff;border-radius:12px;padding:11px 16px;font:700 14px "Noto Sans KR",system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)}';

  function toast(t) {
    var el = document.createElement('div'); el.className = 'mitoast'; el.textContent = t; document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }
  function close() { if (layer) { layer.remove(); layer = null; } busy = false; }
  function postcode(cb) {
    function go() { new window.daum.Postcode({ oncomplete: function (d) { cb(d.roadAddress || d.address); } }).open(); }
    if (window.daum && window.daum.Postcode) return go();
    var s = document.createElement('script'); s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    s.onload = go; s.onerror = function () { toast(T('주소 검색을 불러오지 못했어요. 직접 입력해 주세요.', 'Could not load address search.')); };
    document.head.appendChild(s);
  }

  function draw(p, email) {
    layer.innerHTML = '<div class="mibox" role="dialog" aria-modal="true" aria-labelledby="mi-h">' +
      '<h2 id="mi-h">' + T('내 정보 수정', 'Edit my info') + '</h2>' +
      '<p class="sub">' + T('가입할 때 적은 정보를 고칠 수 있어요.', 'Update the details you signed up with.') + '</p>' +
      '<form id="mi-form" autocomplete="off">' +
      '<label>' + T('아이디(이메일)', 'Login email') + '</label><input readonly value="' + esc(email) + '">' +
      '<div class="two"><div><label for="mi-name">' + T('이름', 'Name') + ' *</label><input id="mi-name" maxlength="30" value="' + esc(p.name) + '"></div>' +
      '<div><label for="mi-birth">' + T('생년월일', 'Birth date') + '</label><input id="mi-birth" type="date" value="' + esc(p.birth || '') + '"></div></div>' +
      '<label for="mi-phone">' + T('휴대폰 번호', 'Phone') + ' *</label><input id="mi-phone" inputmode="tel" maxlength="13" value="' + esc(fmtPhone(p.phone)) + '">' +
      '<div class="two"><div><label for="mi-bank">' + T('은행', 'Bank') + '</label><input id="mi-bank" maxlength="20" value="' + esc(p.bank || '') + '"></div>' +
      '<div><label for="mi-account">' + T('계좌번호', 'Account no.') + '</label><input id="mi-account" inputmode="numeric" maxlength="30" value="' + esc(p.account || '') + '"></div></div>' +
      '<label for="mi-address">' + T('집주소', 'Home address') + '</label><div class="addr"><input id="mi-address" maxlength="120" value="' + esc(p.address || '') + '"><button type="button" class="sm" id="mi-find">' + T('주소찾기', 'Search') + '</button></div>' +
      '<p class="sec">' + T('비밀번호 바꾸기 (바꿀 때만 적어 주세요)', 'Change password (optional)') + '</p>' +
      '<div class="two"><div><label for="mi-pw">' + T('새 비밀번호', 'New password') + '</label><input id="mi-pw" type="password" autocomplete="new-password" placeholder="' + T('8자 이상', '8+ characters') + '"></div>' +
      '<div><label for="mi-pw2">' + T('한 번 더', 'Confirm') + '</label><input id="mi-pw2" type="password" autocomplete="new-password"></div></div>' +
      '<p class="err" id="mi-err" hidden></p>' +
      '<div class="row"><button type="button" class="ghost" id="mi-cancel">' + T('닫기', 'Close') + '</button><button type="submit" class="go" id="mi-save">' + T('저장', 'Save') + '</button></div>' +
      '</form></div>';
    var $ = function (id) { return layer.querySelector('#' + id); };
    $('mi-cancel').onclick = close;
    $('mi-find').onclick = function () { postcode(function (a) { $('mi-address').value = a; }); };
    $('mi-phone').oninput = function (e) { e.target.value = fmtPhone(e.target.value); };
    $('mi-form').onsubmit = function (e) {
      e.preventDefault(); if (busy) return;
      var err = $('mi-err'), fail = function (t) { err.textContent = t; err.hidden = false; busy = false; $('mi-save').disabled = false; };
      var v = {
        name: $('mi-name').value.trim(), phone: $('mi-phone').value.trim(), birth: $('mi-birth').value || null,
        bank: $('mi-bank').value.trim(), account: $('mi-account').value.trim(), address: $('mi-address').value.trim()
      };
      if (String(p.phone || '').indexOf('-') < 0) v.phone = v.phone.replace(/\D/g, '');   // 원래 저장 방식(숫자만)을 그대로 지켜요
      var pw = $('mi-pw').value, pw2 = $('mi-pw2').value;
      if (!v.name) return fail(T('이름을 적어 주세요.', 'Please enter your name.'));
      if (v.phone.replace(/\D/g, '').length < 10) return fail(T('휴대폰 번호를 확인해 주세요.', 'Please check your phone number.'));
      if (pw || pw2) {
        if (pw.length < 8) return fail(T('새 비밀번호는 8자 이상으로 정해 주세요.', 'Password must be 8+ characters.'));
        if (pw !== pw2) return fail(T('새 비밀번호가 서로 달라요.', 'Passwords do not match.'));
      }
      var s = sess(); if (!s) return fail(T('로그인이 끝났어요. 다시 로그인해 주세요.', 'Session expired. Please log in again.'));
      busy = true; $('mi-save').disabled = true; err.hidden = true;
      fetch(URL_ + '/rest/v1/profiles?id=eq.' + encodeURIComponent(s.user.id), { method: 'PATCH', headers: hdr(s, { Prefer: 'return=representation' }), body: JSON.stringify(v) })
        .then(function (r) { return r.ok ? r.json() : r.text().then(function (t) { throw new Error(t); }); })
        .then(function (rows) {
          if (!rows || !rows.length) throw new Error('no row');
          if (!pw) return null;
          return fetch(URL_ + '/auth/v1/user', { method: 'PUT', headers: hdr(s), body: JSON.stringify({ password: pw }) })
            .then(function (r) { if (!r.ok) return r.json().then(function (j) { throw new Error('pw:' + ((j && (j.msg || j.message)) || '')); }); });
        })
        .then(function () {
          close(); toast(pw ? T('내 정보와 비밀번호를 바꿨어요.', 'Info and password updated.') : T('내 정보를 저장했어요.', 'Saved.'));
          try { window.dispatchEvent(new CustomEvent('myinfo:saved', { detail: v })); } catch (_) {}
        })
        .catch(function (e) {
          var m = String(e && e.message || '');
          if (/^pw:/.test(m)) return fail(T('정보는 저장했지만 비밀번호는 바꾸지 못했어요. ', 'Info saved, but password was not changed. ') + (/same|different/i.test(m) ? T('지금 비밀번호와 다른 걸로 정해 주세요.', 'Use a different password.') : T('잠시 후 다시 해 주세요.', 'Please try again later.')));
          fail(T('저장하지 못했어요. 잠시 후 다시 해 주세요.', 'Could not save. Please try again.'));
        });
    };
    setTimeout(function () { var n = $('mi-name'); if (n) n.focus(); }, 30);
  }

  function open() {
    var s = sess(); if (!s) { toast(T('로그인한 뒤에 쓸 수 있어요.', 'Please log in first.')); return; }
    if (!document.getElementById('mi-css')) { var st = document.createElement('style'); st.id = 'mi-css'; st.textContent = css; document.head.appendChild(st); }
    close();
    layer = document.createElement('div'); layer.className = 'milayer';
    layer.innerHTML = '<div class="mibox"><p class="sub">' + T('불러오는 중…', 'Loading…') + '</p></div>';
    layer.addEventListener('click', function (e) { if (e.target === layer && !busy) close(); });
    document.body.appendChild(layer);
    fetch(URL_ + '/rest/v1/profiles?select=' + FIELDS + '&id=eq.' + encodeURIComponent(s.user.id), { headers: hdr(s) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) {
        if (!layer) return;
        if (!rows || !rows.length) { close(); toast(T('내 정보를 불러오지 못했어요.', 'Could not load your info.')); return; }
        draw(rows[0], s.user.email || '');
      })
      .catch(function () { close(); toast(T('인터넷 연결을 확인해 주세요.', 'Check your connection.')); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && layer && !busy) close(); });
  window.MyInfo = { open: open };
})();
