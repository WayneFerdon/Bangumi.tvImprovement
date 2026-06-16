/* eslint-env browser */
// ==UserScript==
// @name         Bangumi index.html edit improvement
// @version 2026.05.15
// @include      /https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/$/
// @downloadURL https://github.com/WayneFerdon/Bangumi.tvImprovement/raw/refs/heads/main/BangumiIndex.htmlEditImprovement.user.js
// @updateURL https://github.com/WayneFerdon/Bangumi.tvImprovement/raw/refs/heads/main/BangumiIndex.htmlEditImprovement.user.js
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

function $doc(h) {const d=document.implementation.createHTMLDocument('');d.documentElement.innerHTML=h;return d;}
function $qs(q,d) {return (d||document).querySelector(q);}
function $qsa(q,d) {return Array.from((d||document).querySelectorAll(q));}

var $ajax = {
  debug: false,
  interval: 300, // DO NOT DECREASE THIS NUMBER, OR IT MAY TRIGGER THE SERVER'S LIMITER AND YOU WILL GET BANNED
  max: 4,
  tid: null,
  error: null,
  conn: 0,
  queue: [],

  insert: function (url, data, method, context = {}, headers = {}) {
    return $ajax.fetch(url, data, method, context, headers, true);
  },
  fetch: function (url, data, method, context = {}, headers = {}, isInsert = false) {
    return new Promise((resolve, reject) => {
      $ajax.add(method, url, data, resolve, reject, context, headers, isInsert);
    });
  },
  open: function (url, data, method, context = {}, headers = {}) {
    $ajax.fetch(url, data, method, context, headers).then(goto).catch( err => { console.error(err); });
  },
  openNoFetch: function (url, newTab) {
    window.open(url, newTab ? '_blank' : '_self');
  },
  repeat: function (count, func, ...args) {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(func(...args));
    }
    return list;
  },
  add: function (method, url, data, onload, onerror, context = {}, headers = {}, isInsert = false) {
    method = !data ? 'GET' : method ?? 'POST';
    if (method === 'POST') {
      headers['Content-Type'] ??= 'application/x-www-form-urlencoded';
      if (data && typeof data === 'object') {
        data = Object.entries(data).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
      }
    } else if (method === 'JSON') {
      method = 'POST';
      headers['Content-Type'] ??= 'application/json';
      if (data && typeof data === 'object') {
        data = JSON.stringify(data);
      }
    }
    context.onload = onload;
    context.onerror = onerror;
    if (isInsert) {
      $ajax.queue.unshift({ method, url, data, headers, context, onload: $ajax.onload, onerror: $ajax.onerror });
    } else {
      $ajax.queue.push({ method, url, data, headers, context, onload: $ajax.onload, onerror: $ajax.onerror });
    }
    $ajax.next();
  },
  next: function () {
    if (!$ajax.queue.length) {
      return;
    }
    if ($ajax.tid) {
      if (!$ajax.conn) {
        clearTimeout($ajax.tid);
        $ajax.tid = null;
        $ajax.timer();
        $ajax.send();
      }
    } else {
      if ($ajax.conn < $ajax.max) {
        $ajax.timer();
        $ajax.send();
      }
    }
  },
  getLast: function () {
    return;
    const v = window.localStorage.getItem($config.ns + '_last_post');
    return v === null ? undefined : JSON.parse(v);
  },
  setLast: function (last) {
    return;
    window.localStorage.setItem($config.ns + '_last_post', JSON.stringify(last));
  },
  timer: function () {
    function ontimer() {
      const now = new Date().getTime();
      const last = $ajax.getLast();
      if (!last || now - last >= $ajax.interval) {
        $ajax.next();
        $ajax.setLast(now);
        return;
      }
      $ajax.tid = null;
      $ajax.next();
    };
    $ajax.tid = setTimeout(ontimer, $ajax.interval);
  },
  simplify: function (r) {
    const info = {};
    info.url = r.url;
    if (r.data) info.data = r.data;
    if (r.method) info.method = r.method;
    if (r.context && JSON.stringify(r.context) !== JSON.stringify({})) info.context = r.context;
    if (r.headers && JSON.stringify(r.headers) !== JSON.stringify({})) info.headers = r.headers;
    return info;
  },
  send: function () {
    const current = $ajax.queue.shift();
    GM_xmlhttpRequest(current);
    $ajax.conn++;
    if (!$ajax.debug) return;
    const remain = $ajax.queue.map($ajax.simplify);
    console.log('$ajax.send:', $ajax.simplify(current), ... remain?.length ? ['remain:', remain] : []);
  },
  onload: function (r) {
    $ajax.conn--;
    const text = r.responseText;
    if (r.status !== 200) {
      $ajax.error = `${r.status} ${r.statusText}: ${r.finalUrl}`;
      r.context.onerror?.(new Error($ajax.error));
    } else if (text === 'state lock limiter in effect') {
      if ($ajax.error !== text) {
        // popup(`<p style="color: #f00; font-weight: bold;">${text}</p><p>Your connection speed is so fast that <br>you have reached the maximum connection limit.</p><p>Try again later.</p>`);
        console.error(`${text}\nYour connection speed is so fast that you have reached the maximum connection limit. Try again later.`);
      }
      $ajax.error = text;
      r.context.onerror?.(new Error($ajax.error));
    } else {
      r.context.onload?.(text);
      $ajax.next();
    }
  },
  onerror: function (r) {
    $ajax.conn--;
    $ajax.error = `${r.status} ${r.statusText}: ${r.finalUrl}`;
    r.context.onerror?.(new Error($ajax.error));
    $ajax.next();
  },
};

window.addEventListener('unhandledrejection', (e) => { console.error($ajax.error, e); });

$qsa('.infoWrapper', $qs('.infoWrapperContainer')).forEach( async info=> { try {
  const epBtns = $qsa('.prg_list>li', info);
  let epBtn = null;
  for(let btn of epBtns) {
    if(btn.classList.contains('subtitle')) break;
    epBtn = btn;
  };
  if(epBtn !== null && $qs(".epBtnWatched", epBtn) === null) return;
  const epGird = $qs('.epGird', info);
  const doc = $doc(await $ajax.fetch($qs('a:not(.prgCheckIn)', epGird).href));
  const container = $qs(".SidePanel.png_bg", doc);
  const progress = $qs(".panelProgress", container);
  const form = $qs('form[name="merge"]', doc);
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    var formData = new FormData(form);
    var xhr = new XMLHttpRequest(); // 创建 XMLHttpRequest 对象
    xhr.open('POST', form.action, true); // 初始化一个请求
    xhr.send(formData); // 发送请求
  });

  container.style.cssText += "margin-bottom: 0; padding: 0;";
  progress.style.cssText += "margin: 0; padding: 0;";
  form.style.cssText += "width: min-content; font-size: 13px; display: ruby;";
  $qs("h4", progress).style.cssText += "display: none;";
  $qs(".progress", progress).style.cssText += "display: none;";
  Array.from(container.children).forEach(node=>{
    if(node === progress) return;
    node.style.cssText += "display: none;";
  });
  epGird.appendChild(container);
} catch(err) { console.error(err); }});
