// ==UserScript==
// @name         BGMautoloadallandhide
// @namespace    http://tampermonkey.net/
// @version      2026.05.15
// @description  try to take over the world!
// @author       WayneFerdon
// @downloadURL https://github.com/WayneFerdon/Bangumi.tvImprovement/raw/refs/heads/main/BGMautoloadallandhide.user.js
// @updateURL https://github.com/WayneFerdon/Bangumi.tvImprovement/raw/refs/heads/main/BGMautoloadallandhide.user.js
// @match      https://bangumi.tv/*/browser/*
// @match      https://bangumi.tv/*/list/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

function gE(ele, mode, parent) { // 获取元素
  if (typeof ele === 'object') return ele;
  if (mode === undefined && parent === undefined) return (isNaN(ele * 1)) ? document.querySelector(ele) : document.getElementById(ele);
  if (mode === 'all') return (parent === undefined) ? document.querySelectorAll(ele) : parent.querySelectorAll(ele);
  if (typeof mode === 'object' && parent === undefined) return mode.querySelector(ele);
}

aotuLoadAll();
checkLoadingDone();

function checkLoadingDone(){
  let loaded = true;
  for (let item of gE('.page_inner>a','all')) {
    if(item.innerText === "››") {
      loaded = false;
      break;
    }
  }
  if(!loaded) {
    setTimeout(checkLoadingDone, 1000);
    return;
  }
  if (window.location.href.includes('list')) return;
  for (let item of gE('#browserItemList>li','all')) {
    if(gE('.collectModify',item)) {
      item.style.cssText += 'display: none;'
    }
  }
}

function aotuLoadAll(){
  const btns = gE('.section>a,#columnSubjectBrowserA>a','all');
  console.log(btns)
  if(btns.length) {
    btns[1].click();
    return;
  }
  setTimeout(aotuLoadAll, 1000)
}
