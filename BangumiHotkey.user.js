// ==UserScript==
// @name         BangumiHotkey
// @namespace    http://tampermonkey.net/
// @version      2026.05.15
// @downloadURL https://github.com/WayneFerdon/Bangumi.tvImprovement/raw/refs/heads/main/BangumiHotkey.user.js
// @updateURL https://github.com/WayneFerdon/Bangumi.tvImprovement/raw/refs/heads/main/BangumiHotkey.user.js
// @description  try to take over the world!
// @author       WayneFerdon
// @match      https://bangumi.tv/subject/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==
const [_, id, trans, name] = gE('.nameSingle').innerHTML.match(/href="\/subject\/(.*)" title="(.*)" property.*>(.*)<\/a>/);
const start = Array.from(gE('#infobox li', 'all')).find(info=> gE('span', info).innerHTML.includes('开始: '))?.lastChild.textContent.split(/年|月|日|-/) ?? [];
const os = Array.from(gE('#infobox li', 'all')).find(info=> gE('span', info).innerHTML.includes('官方网站: '));
console.log(start)
const infoDisplay = cE('a');
infoDisplay.href = gE('a', os).href;
const y = padNumber(start[0] ?? 0);
const md = `${padNumber(start[1]??0)}${padNumber(start[2]??0)}`;
let eps = 0;
for (const ep of gE('.prg_list li', 'all')) {
  if (ep.classList.contains('subtitle')) break;
  eps++;
}
infoDisplay.innerHTML = [id, name, trans, y, md, eps];
gE('.nameSingle').appendChild(cE('br'));
gE('.nameSingle').appendChild(infoDisplay);

function padNumber(num, fill=2) {
    let len = ('' + num).length;
    if (fill > len) {
        num = Array(fill - len + 1 || 0).join("0") + num;
    } else {
      num = num[len-2] + num[len-1]
    }
    return num;
}

function gE(ele, mode, parent) { // 获取元素
  if (typeof ele === 'object') return ele;
  if (mode === undefined && parent === undefined) return (isNaN(ele * 1)) ? document.querySelector(ele) : document.getElementById(ele);
  if (mode === 'all') return (parent === undefined) ? document.querySelectorAll(ele) : parent.querySelectorAll(ele);
  if (typeof mode === 'object' && parent === undefined) return mode.querySelector(ele);
}

function cE(name) { // 创建元素
  return document.createElement(name);
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const keyCode = e.keyCode;
  const secTab = gE('.secTab');
  if(secTab) {
    const [wish, collect, watching, onhold, dropped] = gE('.secTab>li>a', 'all');
    const handlers = [
      [81, dropped],//q
      [87, wish],//w
      [69, watching],//e
      [82, collect],//r
    ]
    console.log(keyCode)
    for (let [key, ui] of handlers) {
      if (key === -1 || keyCode!==key) continue;
      gE(ui).click();
      onSave();
      return;
    }
  } else {
    gE('#modifyCollect').click();
    onEdit();
  }

  function onEdit(){
    const inputs = gE('.collectType>label>input', 'all');
    if(inputs.length){
      const [wish, collect, watching, onhold, dropped] = inputs;
      const handlers = [
        [81, dropped],//q
        [87, wish],//w
        [69, watching],//e
        [82, collect],//r
        [84, onhold],//t
      ]
      for (let [key, ui] of handlers) {
        if (key === -1 || keyCode!==key) continue;
        gE(ui).click();
        onSave();
        return;
      }
      return;
    }
    setTimeout(onEdit, 1000);
  }

  function onSave(isDroped=false){
    const saveBtn = gE('.clearit>#submitBtnO>.inputBtn');
    if(saveBtn) {
      saveBtn.click();
      return;
    }
    setTimeout(onSave, 1000);
  }
}, false);
