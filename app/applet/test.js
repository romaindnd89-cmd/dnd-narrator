const atou=(str)=>{try{return decodeURIComponent(atob(str).split("").map(c=>"%"+("00"+c.charCodeAt(0).toString(16)).slice(-2)).join(""));}catch(e){return null;}};
const utoa=(str)=>btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,(m,p1)=>String.fromCharCode(parseInt(p1,16))));
const session={name:"ééé"};
const u=utoa(JSON.stringify(session));
console.log(u);
console.log(atou(u));
