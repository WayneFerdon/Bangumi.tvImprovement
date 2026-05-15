/* eslint-env browser */
// ==UserScript==
// @name         Bangumi index.html edit improvement
// @version 2026.05.15
// @include      /https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/$/
// @downloadURL https://github.com/WayneFerdon/Bangumi.tvImprovement/raw/refs/heads/main/BangumiIndex.htmlEditImprovement.user.js
// @updateURL https://github.com/WayneFerdon/Bangumi.tvImprovement/raw/refs/heads/main/BangumiIndex.htmlEditImprovement.user.js
// @grant        GM_deleteValue
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

/* jshint loopfunc:true */
/* jshint esversion:6 */
//ajax
function $doc(h) {
  const d = document.implementation.createHTMLDocument(''); d.documentElement.innerHTML = h; return d;
}
var $ajax = {

  interval: 300, // DO NOT DECREASE THIS NUMBER, OR IT MAY TRIGGER THE SERVER'S LIMITER AND YOU WILL GET BANNED
  max: 4,
  tid: null,
  conn: 0,
  index: 0,
  queue: [],

  fetch: function (url, data, method, context = {}, headers = {}) {
    return new Promise((resolve, reject) => {
      $ajax.add(method, url, data, resolve, reject, context, headers);
    });
  },
  open: function (url, data, method, context = {}, headers = {}) {
    $ajax.fetch(url, data, method, context, headers).then(goto).catch(e=>{console.error(e)});
  },
  openNoFetch: function (url, newTab) {
    window.open(url, newTab ? '_blank' : '_self')
    // const a = gE('body').appendChild(cE('a'));
    // a.href = url;
    // a.target = newTab ? '_blank' : '_self';
    // a.click();
  },
  repeat: function (count, func, ...args) {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(func(...args));
    }
    return list;
  },
  add: function (method, url, data, onload, onerror, context = {}, headers = {}) {
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
    $ajax.queue.push({ method, url, data, headers, context, onload: $ajax.onload, onerror: $ajax.onerror });
    $ajax.next();
  },
  next: function () {
    if (!$ajax.queue[$ajax.index] || $ajax.error) {
      return;
    }
    if ($ajax.tid) {
      if (!$ajax.conn) {
        clearTimeout($ajax.tid);
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
  timer: function () {
    var _ns = false ? 'hvuti' : 'hvut';
    function getValue(k, d, p = _ns + '_') { const v = localStorage.getItem(p + k); return v === null ? d : JSON.parse(v); }
    function setValue(k, v, p = _ns + '_', r) { localStorage.setItem(p + k, JSON.stringify(v, r)); }
    function ontimer() {
      const now = new Date().getTime();
      const last = getValue('last_post');
      if (last && last - now < $ajax.interval) {
        $ajax.next();
        return;
      }
      setValue('last_post', now);
      $ajax.tid = null;
      $ajax.next();
    };
    $ajax.tid = setTimeout(ontimer, $ajax.interval);
  },
  send: function () {
    GM_xmlhttpRequest($ajax.queue[$ajax.index]);
    $ajax.index++;
    $ajax.conn++;
  },
  onload: function (r) {
    $ajax.conn--;
    const text = r.responseText;
    if (r.status !== 200) {
      $ajax.error = `${r.status} ${r.statusText}: ${r.finalUrl}`;
      r.context.onerror?.();
    } else if (text === 'state lock limiter in effect') {
      if ($ajax.error !== text) {
        // popup(`<p style="color: #f00; font-weight: bold;">${text}</p><p>Your connection speed is so fast that <br>you have reached the maximum connection limit.</p><p>Try again later.</p>`);
        console.error(`${text}\nYour connection speed is so fast that you have reached the maximum connection limit. Try again later.`)
      }
      $ajax.error = text;
      r.context.onerror?.();
    } else {
      r.context.onload?.(text);
      $ajax.next();
    }
  },
  onerror: function (r) {
    $ajax.conn--;
    $ajax.error = `${r.status} ${r.statusText}: ${r.finalUrl}`;
    r.context.onerror?.();
    $ajax.next();
  },
};

window.addEventListener('unhandledrejection', (e) => { console.error($ajax.error, e); });


function cE(name) { // 创建元素
  return document.createElement(name);
}

function gE(ele, mode, parent) { // 获取元素
  if (typeof ele === 'object') {
    return ele;
  } if (mode === undefined && parent === undefined) {
    return (isNaN(ele * 1)) ? document.querySelector(ele) : document.getElementById(ele);
  } if (mode === 'all') {
    return (parent === undefined) ? document.querySelectorAll(ele) : parent.querySelectorAll(ele);
  } if (typeof mode === 'object' && parent === undefined) {
    return mode.querySelector(ele);
  }
}

gE('.infoWrapper', 'all', gE('.infoWrapperContainer')).forEach( async info=>{
  const epBtns = gE('.prg_list>li', 'all', info);
  let epBtn = null;
  for(let btn of epBtns)
  {
    if(btn.classList.contains('subtitle')){
      break;
    }
    epBtn = btn;
  };
  if(epBtn !== null && gE(".epBtnWatched", epBtn) === null){
    return;
  }
  const epGird = gE('.epGird', info);
  const doc = $doc(await $ajax.fetch(gE('a:not(.prgCheckIn)', epGird).href));
  const container = gE(".SidePanel.png_bg", doc);
  const progress = gE(".panelProgress", container);
  const form = gE('form[name="merge"]', doc);
  form.style.cssText += "width: min-content; font-size: 13px; display: ruby;";
  form.method
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    var formData = new FormData(form);
    var xhr = new XMLHttpRequest(); // 创建 XMLHttpRequest 对象
    xhr.open('POST', form.action, true); // 初始化一个请求
    xhr.send(formData); // 发送请求
});

  container.style.cssText += "margin-bottom: 0; padding: 0;";
  progress.style.cssText += "margin: 0; padding: 0;";
  gE("h4", progress).style.cssText += "display: none;";
  gE(".progress", progress).style.cssText += "display: none;";
  Array.from(container.children).forEach(node=>{
    if(node === progress) return;
    node.style.cssText += "display: none;";
  });
  epGird.appendChild(container);
})
