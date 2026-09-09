import { loadPublicOffers } from './offers-data.js';
import { AIRLINES } from './catalog-data.js';
import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money=(n,c)=>`${Number(n||0).toLocaleString('en-US')} ${c||'USD'}`;
let offers=[];
const airline=id=>AIRLINES.find(x=>x.id===id);

function finalPrice(o){
 const d=o.discount||{}; if(!d.enabled) return Number(o.price)||0;
 return d.type==='percent'?Math.max(0,Number(o.price)*(1-Number(d.value||0)/100)):Math.max(0,Number(o.price)-Number(d.value||0));
}
function card(o){
 const a=airline(o.airlineId); const final=finalPrice(o);
 return `<article class="catalog-card"><div class="catalog-image"><img src="${esc(o.image||'assets/images/offers/cleaned/florin-offer-clean.png')}" alt="${esc(o.name)}" loading="lazy">${o.discount?.enabled?`<span class="discount-badge">${esc(o.discount.label||`خصم ${o.discount.value}${o.discount.type==='percent'?'%':''}`)}</span>`:''}</div><div class="catalog-body"><div class="mini-type">${esc(o.category||'عرض')}</div><h3>${esc(o.name)}</h3>${a?`<div class="catalog-airline">${a.logo?`<img src="${esc(a.logo)}" alt="${esc(a.name)}">`:''}<span>${esc(a.name)} ${a.iata?`(${a.iata})`:''}</span></div>`:''}<p>${esc(o.description||'عرض قابل للتخصيص حسب طلب العميل.')}</p><div class="catalog-bottom"><div>${o.discount?.enabled?`<del>${money(o.price,o.currency)}</del>`:''}<strong>${money(final,o.currency)}</strong></div><a class="btn-primary" href="booking.html?offer=${encodeURIComponent(o.id)}&offerName=${encodeURIComponent(o.name)}">التفاصيل وطلب الحجز</a></div></div></article>`;
}
function render(){
 const root=document.querySelector('#offersRoot');
 const q=document.querySelector('#offerSearch').value.trim().toLowerCase();
 const category=document.querySelector('#offerCategory').value;
 let rows=offers.filter(o=>o.active!==false && o.type!=='flight');
 if(q) rows=rows.filter(o=>[o.name,o.destination,o.country,o.category].some(v=>String(v||'').toLowerCase().includes(q)));
 if(category) rows=rows.filter(o=>o.category===category);
 const groups={}; rows.forEach(o=>(groups[o.destination||'عروض متنوعة']??=[]).push(o));
 root.innerHTML=Object.keys(groups).length?Object.entries(groups).map(([dest,list])=>`<section class="destination-group"><div class="group-head"><div><span class="eyebrow">DESTINATION</span><h2>${esc(dest)}</h2></div><span>${list.length} عرض</span></div><div class="catalog-grid">${list.map(card).join('')}</div></section>`).join(''):`<div class="empty-state">لا توجد عروض مطابقة.</div>`;
}
async function init(){
 offers=await loadPublicOffers();
 const cats=[...new Set(offers.filter(o=>o.type!=='flight').map(o=>o.category).filter(Boolean))];
 document.querySelector('#offerCategory').innerHTML='<option value="">كل الخدمات</option>'+cats.map(c=>`<option>${esc(c)}</option>`).join('');
 document.querySelector('#offerSearch').addEventListener('input',render);document.querySelector('#offerCategory').addEventListener('change',render);render();
}
init();
