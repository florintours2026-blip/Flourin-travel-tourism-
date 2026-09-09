import { loadPublicOffers } from './offers-data.js';
import { AIRPORTS, AIRLINES, DEFAULT_FLIGHT_OFFERS } from './catalog-data.js';

const $ = (s, r=document) => r.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money = (n,c='USD') => `${Number(n||0).toLocaleString('en-US')} ${c}`;
const airport = code => AIRPORTS.find(a=>a.iata===code) || {iata:code,city:code,name:'Airport',nameEn:'Airport'};
const airline = id => AIRLINES.find(a=>a.id===id) || {id,name:id,nameEn:id,iata:'',logo:''};

let allFlights = DEFAULT_FLIGHT_OFFERS;

function airportLabel(a){ return `${a.city} — ${a.name} (${a.iata})`; }

function fillAirportLists(){
  const from = $('#flightFrom'), to = $('#flightTo');
  [from,to].forEach(select=>{
    if(!select) return;
    select.innerHTML = `<option value="">اختر المطار</option>` + AIRPORTS.map(a=>`<option value="${a.iata}">${esc(airportLabel(a))}</option>`).join('');
  });
}

function setupAirportSearch(){
  const inputs = document.querySelectorAll('[data-airport-search]');
  inputs.forEach(input=>{
    const list = document.createElement('div'); list.className='airport-suggestions'; input.parentElement.appendChild(list);
    const render = () => {
      const q = input.value.trim().toLowerCase();
      if(!q){ list.innerHTML=''; list.classList.remove('show'); return; }
      const rows = AIRPORTS.filter(a => [a.iata,a.city,a.cityEn,a.country,a.countryEn,a.name,a.nameEn].some(v=>String(v).toLowerCase().includes(q))).slice(0,8);
      list.innerHTML = rows.map(a=>`<button type="button" data-code="${a.iata}"><strong>${a.iata}</strong><span>${esc(a.city)} — ${esc(a.name)}</span></button>`).join('');
      list.classList.toggle('show',rows.length>0);
      list.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{input.value=btn.dataset.code; input.dispatchEvent(new Event('change')); list.classList.remove('show');});
    };
    input.addEventListener('input',render);
    input.addEventListener('focus',render);
  });
}

function card(f){
  const from=airport(f.fromIata), to=airport(f.toIata), al=airline(f.airlineId);
  const d=f.discount?.enabled ? Number(f.discount.value||0) : 0;
  const final=f.discount?.enabled ? (f.discount.type==='percent' ? Number(f.price)*(1-d/100) : Math.max(0,Number(f.price)-d)) : Number(f.price);
  return `<article class="flight-card">
    <div class="flight-media"><img src="${esc(f.image)}" alt="${esc(from.city)} ${esc(to.city)}" loading="lazy"><span class="route-badge">${esc(from.iata)} → ${esc(to.iata)}</span>${f.discount?.enabled?`<span class="discount-badge">${esc(f.discount.label||`خصم ${d}%`)}</span>`:''}</div>
    <div class="flight-body">
      <div class="airline-row"><div class="airline-logo">${al.logo?`<img src="${esc(al.logo)}" alt="${esc(al.name)}">`:`<b>${esc(al.iata)}</b>`}</div><div><strong>${esc(al.name)}</strong><small>${esc(al.nameEn)} · ${esc(al.iata)}</small></div></div>
      <div class="route"><div><b>${esc(from.city)}</b><small>${esc(from.name)} · ${from.iata}</small></div><i class="fa-solid fa-plane"></i><div><b>${esc(to.city)}</b><small>${esc(to.name)} · ${to.iata}</small></div></div>
      <div class="flight-meta"><span>🕒 ${esc(f.duration||'حسب التوفر')}</span><span>🧳 ${esc(f.baggage||'حسب التذكرة')}</span><span>✈️ ${esc(f.stopover||'حسب الرحلة')}</span></div>
      <div class="price-row">${f.discount?.enabled?`<del>${money(f.price,f.currency)}</del>`:''}<strong>${money(final,f.currency)}</strong></div>
      <a class="btn-primary" href="booking.html?offer=${encodeURIComponent(f.id)}&offerName=${encodeURIComponent(f.name)}&from=${f.fromIata}&to=${f.toIata}">اطلب الحجز</a>
    </div>
  </article>`;
}

function render(rows){
  const grid=$('#flightResults');
  grid.innerHTML = rows.length ? rows.map(card).join('') : `<div class="empty-state">لا توجد رحلات مطابقة. جرّب كود مطار مثل CAI أو JED.</div>`;
  $('#resultCount').textContent = rows.length;
}

function filterFlights(){
  const from=$('#fromSearch').value.trim().toUpperCase();
  const to=$('#toSearch').value.trim().toUpperCase();
  const q=$('#airlineSearch').value.trim().toLowerCase();
  let rows=allFlights.filter(f=> (!from||f.fromIata===from) && (!to||f.toIata===to));
  if(q) rows=rows.filter(f=>{const a=airline(f.airlineId); return [a.name,a.nameEn,a.iata].some(v=>String(v).toLowerCase().includes(q));});
  const sort=$('#sortFlights').value;
  if(sort==='priceAsc') rows.sort((a,b)=>Number(a.price)-Number(b.price));
  if(sort==='priceDesc') rows.sort((a,b)=>Number(b.price)-Number(a.price));
  render(rows);
}

async function init(){
  fillAirportLists(); setupAirportSearch();
  allFlights=(await loadPublicOffers()).filter(x=>x.type==='flight' && x.active!==false);
  if(!allFlights.length) allFlights=DEFAULT_FLIGHT_OFFERS;
  render(allFlights);
  $('#flightSearchForm').addEventListener('submit',e=>{e.preventDefault(); filterFlights();});
  ['fromSearch','toSearch','airlineSearch','sortFlights'].forEach(id=>$('#'+id)?.addEventListener('change',filterFlights));
}
init();
