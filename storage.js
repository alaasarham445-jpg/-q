(function(){
'use strict';
var KEY=/^walk_/,DB='khatawati-backup',ST='kv',timer=null;
var sp=Storage.prototype,si=sp.setItem,ri=sp.removeItem;
function open(){return new Promise(function(res,rej){var r=indexedDB.open(DB,1);r.onupgradeneeded=function(){r.result.createObjectStore(ST)};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}})}
function snap(){var o={};try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(KEY.test(k))o[k]=localStorage.getItem(k)}}catch(e){}return o}
function flush(){clearTimeout(timer);var o=snap(),ks=Object.keys(o);if(!ks.length)return;open().then(function(db){var s=db.transaction(ST,'readwrite').objectStore(ST);ks.forEach(function(k){s.put(o[k],k)})}).catch(function(){})}
function later(){clearTimeout(timer);timer=setTimeout(flush,400)}
function del(k){open().then(function(db){db.transaction(ST,'readwrite').objectStore(ST).delete(k)}).catch(function(){})}
try{
sp.setItem=function(k,v){si.call(this,k,v);if(this===localStorage&&KEY.test(k))later()};
sp.removeItem=function(k){ri.call(this,k);if(this===localStorage&&KEY.test(k))del(k)};
}catch(e){}
function restore(){
open().then(function(db){return new Promise(function(res){var got={},rq=db.transaction(ST,'readonly').objectStore(ST).openCursor();rq.onsuccess=function(){var c=rq.result;if(c){got[c.key]=c.value;c.continue()}else res(got)};rq.onerror=function(){res({})}})})
.then(function(got){var n=0;try{Object.keys(got).forEach(function(k){if(KEY.test(k)&&localStorage.getItem(k)===null){si.call(localStorage,k,got[k]);n++}})}catch(e){}
 if(n&&!sessionStorage.getItem('khs')){sessionStorage.setItem('khs','1');location.reload()}else flush()}).catch(function(){});
}
function persist(){try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(function(){})}catch(e){}}
persist();
addEventListener('click',persist,{once:true});
addEventListener('pagehide',flush);
document.addEventListener('visibilitychange',function(){if(document.hidden)flush()});
restore();
})();
