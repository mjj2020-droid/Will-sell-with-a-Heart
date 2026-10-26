"use strict";

const catalog = [
  {id:"drainer",name:"Dish Drainer Sets",cat:"Kitchenware",desc:"Plate and glass organizers",emoji:"🍽️",tone:"pink"},
  {id:"dishcab",name:"Dish Cabinets",cat:"Kitchenware",desc:"Organize everyday dinnerware",emoji:"🍴",tone:"cream"},
  {id:"casserole",name:"Casseroles & Food Containers",cat:"Kitchenware",desc:"Kitchen and food storage",emoji:"🥘",tone:"mint"},
  {id:"basket",name:"Laundry Baskets",cat:"Laundry",desc:"Handy household laundry baskets",emoji:"🧺",tone:"lilac"},
  {id:"laundry",name:"Laundry Pails",cat:"Laundry",desc:"Practical laundry essentials",emoji:"🫧",tone:"blue"},
  {id:"pail",name:"Pails & Buckets",cat:"Pails & Basins",desc:"Versatile household pails",emoji:"🪣",tone:"peach"},
  {id:"basin",name:"Basins & Dippers",cat:"Pails & Basins",desc:"Useful bath and cleaning basics",emoji:"💧",tone:"blue"},
  {id:"detergent",name:"Detergent Buckets",cat:"Pails & Basins",desc:"Multi-use storage buckets",emoji:"🪣",tone:"mint"},
  {id:"bento",name:"Bento Containers",cat:"Storage",desc:"Compartments for easy packing",emoji:"🍱",tone:"cream"},
  {id:"storage",name:"Storage Containers",cat:"Storage",desc:"Make space for everything",emoji:"📦",tone:"lilac"},
  {id:"cleaning",name:"Cleaning Essentials",cat:"Cleaning",desc:"For everyday home care",emoji:"🧼",tone:"mint"},
  {id:"bags",name:"Sando Bags & Packaging",cat:"Packaging",desc:"Carry bags and packaging items",emoji:"🛍️",tone:"pink"}
];
const byId = id => document.getElementById(id);
const productsEl=byId("products"), countEl=byId("results"), searchEl=byId("search");
const modal=byId("inquiryModal"), cartEl=byId("cartItems");
const STORE="wswah-inquiry-v2";
let category="All";
let cart={};
try {
  const saved=JSON.parse(localStorage.getItem(STORE) || "{}");
  if(saved && typeof saved==="object" && !Array.isArray(saved)){
    catalog.forEach(p=>{
      const n=Number(saved[p.id]);
      if(Number.isSafeInteger(n) && n>0)cart[p.id]=Math.min(n,999);
    });
  }
} catch (_) {}

function saveCart(){try{localStorage.setItem(STORE,JSON.stringify(cart));}catch(_){}}
function qtyTotal(){return Object.values(cart).reduce((sum,n)=>sum+n,0);}
function node(tag,className,text){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!==undefined)el.textContent=text;
  return el;
}
function makeButton(text,className,action,id,label){
  const b=node("button",className,text);
  b.type="button"; b.dataset.action=action; b.dataset.id=id;
  if(label)b.setAttribute("aria-label",label);
  return b;
}
function productCard(p){
  const card=node("article","product");
  const artwork=node("div","art "+p.tone);
  artwork.setAttribute("aria-hidden","true");
  artwork.append(node("span","product-emoji",p.emoji));
  const info=node("div","product-info");
  info.append(node("span","category-tag",p.cat),node("h3","",p.name),node("p","product-desc",p.desc));
  const footer=node("div","product-footer");
  footer.append(node("span","price-label","Price upon inquiry"),makeButton("+ Add","add-button","add",p.id,"Add "+p.name+" to inquiry"));
  info.append(footer);
  card.append(artwork,info);
  return card;
}
function renderProducts(){
  const query=searchEl.value.toLocaleLowerCase().trim();
  const matching=catalog.filter(p=>(category==="All" || p.cat===category) &&
    (p.name+" "+p.cat+" "+p.desc).toLocaleLowerCase().includes(query));
  const sorted=[...matching];
  const order=byId("sort").value;
  if(order==="name")sorted.sort((a,b)=>a.name.localeCompare(b.name));
  if(order==="category")sorted.sort((a,b)=>a.cat.localeCompare(b.cat)||a.name.localeCompare(b.name));
  productsEl.replaceChildren(...sorted.map(productCard));
  countEl.textContent=sorted.length+" "+(sorted.length===1?"product":"products")+" shown";
  byId("noResults").hidden=sorted.length>0;
}
function renderCart(){
  const selected=catalog.filter(p=>cart[p.id]>0);
  const total=qtyTotal();
  byId("cartCount").textContent=total;
  byId("cartSummary").textContent=total+" "+(total===1?"item":"items");
  cartEl.replaceChildren();
  selected.forEach(p=>{
    const line=node("div","cart-item");
    const icon=node("div","cart-icon "+p.tone,p.emoji); icon.setAttribute("aria-hidden","true");
    const info=node("div","cart-name");info.append(node("strong","",p.name),node("small","",p.cat));
    const quantity=node("div","qty-control");
    quantity.append(makeButton("−","","minus",p.id,"Decrease "+p.name),node("span","",String(cart[p.id])),makeButton("+","","plus",p.id,"Increase "+p.name));
    line.append(icon,info,quantity,makeButton("×","remove","remove",p.id,"Remove "+p.name));
    cartEl.append(line);
  });
  byId("emptyCart").hidden=selected.length>0;
  byId("copyInquiry").disabled=selected.length===0;
  byId("clearCart").disabled=selected.length===0;
  saveCart();
}
function changeQty(id,delta){
  if(!catalog.some(p=>p.id===id))return;
  const amount=Math.max(0,Math.min(999,(cart[id]||0)+delta));
  if(amount)cart[id]=amount;else delete cart[id];
  renderCart();
}
let toastTimer;
function notify(msg){
  const toast=byId("toast");
  toast.textContent=msg;toast.classList.add("active");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("active"),2400);
}
function openCart(){
  if(typeof modal.showModal==="function")modal.showModal();else modal.setAttribute("open","");
}
function closeCart(){
  if(typeof modal.close==="function")modal.close();else modal.removeAttribute("open");
}
function messageText(){
  const lines=catalog.filter(p=>cart[p.id]>0).map(p=>cart[p.id]+" x "+p.name);
  return ["Hello! I'd like to inquire at Will Sell With A Heart about these items:","",...lines,"",
    "Please confirm current prices, colors/sizes, stock availability, and delivery or pickup details.","Thank you!"].join("\n");
}
productsEl.addEventListener("click",e=>{
  const b=e.target.closest("[data-action='add']");
  if(!b)return;
  changeQty(b.dataset.id,1);notify("Added to inquiry list");
});
cartEl.addEventListener("click",e=>{
  const b=e.target.closest("button[data-action]");
  if(!b)return;
  if(b.dataset.action==="plus")changeQty(b.dataset.id,1);
  else if(b.dataset.action==="minus")changeQty(b.dataset.id,-1);
  else if(b.dataset.action==="remove"){delete cart[b.dataset.id];renderCart();}
});
document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{
  category=b.dataset.category;
  document.querySelectorAll("[data-category]").forEach(chip=>chip.setAttribute("aria-pressed",String(chip===b)));
  renderProducts();
}));
searchEl.addEventListener("input",renderProducts);
byId("sort").addEventListener("change",renderProducts);
byId("resetFilters").addEventListener("click",()=>{
  searchEl.value="";document.querySelector('[data-category="All"]').click();
});
document.querySelectorAll("[data-open-cart]").forEach(b=>b.addEventListener("click",openCart));
byId("closeCart").addEventListener("click",closeCart);
modal.addEventListener("click",e=>{if(e.target===modal)closeCart();});
byId("clearCart").addEventListener("click",()=>{cart={};renderCart();notify("Inquiry list cleared");});
byId("copyInquiry").addEventListener("click",async()=>{
  const text=messageText();
  try {
    if(!navigator.clipboard?.writeText)throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    notify("Copied! Paste your message to the seller.");
  }catch(_){
    window.prompt("Copy this inquiry message:",text);
  }
});
renderProducts();renderCart();
