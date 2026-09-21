/* FLORIN URL scraper: public-page metadata only. No login/CAPTCHA bypass. */
const PROXIES=[
  url=>`https://r.jina.ai/http://${url.replace(/^https?:\/\//,'')}`,
  url=>`https://r.jina.ai/${url}`,
  url=>`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  url=>`https://corsproxy.io/?${encodeURIComponent(url)}`
];
function detectSource(url){try{const h=new URL(url).hostname.toLowerCase();if(h.includes('booking'))return'booking';if(h.includes('trip.com'))return'trip';if(h.includes('agoda'))return'agoda';return'unknown';}catch{return'invalid';}}
function decode(s){return String(s||'').replace(/\\u002F/g,'/').replace(/\\\//g,'/').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').trim();}
async function fetchViaSources(target){const errors=[];for(const make of PROXIES){try{const u=make(target);const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),20000);const r=await fetch(u,{signal:ctl.signal,headers:{'Accept':'text/html,text/plain,*/*'}});clearTimeout(timer);if(!r.ok){errors.push(`${r.status}`);continue;}let text=await r.text();try{const j=JSON.parse(text);text=j.contents||j.body||text;}catch{}if(text&&text.length>500)return{text,source:u};}catch(e){errors.push(e.message)}}return{text:'',source:'',error:errors.join(' | ')};}
function meta(text,name,prop){const re=new RegExp(`<meta[^>]+(?:${prop?'property':'name'}=["']${prop||name}["'])[^>]+content=["']([^"']+)["']`,'i');const m=text.match(re);return m?decode(m[1]):'';}
function extractImages(text){const out=new Set();const patterns=[
  /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi,
  /https?:\/\/[^\s"'<>\\]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>\\]*)?/gi,
  /https?:\\\/\\\/[^"'<>\\]+\.(?:jpg|jpeg|png|webp)(?:\\?[^"'<>\\]*)?/gi,
  /https:\/\/cf\.bstatic\.com\/[^"'<>\\\s]+/gi,
  /https:\/\/[^"'<>\\\s]*ak-d\.tripcdn\.com[^"'<>\\\s]+/gi
];
for(const re of patterns){for(const m of text.matchAll(re)){const u=decode(m[1]||m[0]).replace(/[),]$/,'');if(!/logo|icon|avatar|sprite/i.test(u))out.add(u);if(out.size>=20)break;}if(out.size>=20)break;}return[...out].slice(0,15);}
function extractTitle(text){const raw=meta(text,'og:title','og:title')||meta(text,'twitter:title','twitter:title')||((text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'').replace(/\s+/g,' ').trim()||((text.match(/^#\s+(.+)$/m)||[])[1]||'').trim();return raw.replace(/\s*[|–—-]\s*(?:Booking\.com|Trip\.com|Agoda).*$/i,'').trim().slice(0,160);}
function extractDescription(text){return meta(text,'og:description','og:description')||meta(text,'description','description')||'';}
function extractStars(text){const ms=[text.match(/"ratingValue"\s*[:=]\s*["']?(\d(?:\.\d)?)/i),text.match(/(\d(?:\.\d)?)\s*(?:stars?|نجوم)/i)];for(const m of ms){const n=Number(m?.[1]);if(n>=1&&n<=5)return n;}return null;}
function extractLocation(text){const patterns=[/"addressLocality"\s*:\s*"([^"]+)/i,/"address"\s*:\s*"([^"]{3,200})/i,/<span[^>]*class=["'][^"']*(?:address|location)[^"']*["'][^>]*>([^<]{3,200})/i];for(const r of patterns){const m=text.match(r);if(m)return decode(m[1]);}return'';}
function slugFallback(url){try{const p=new URL(url).pathname.split('/').filter(Boolean).pop()||'';return p.replace(/\.(?:html?)$/i,'').replace(/\.ar$/i,'').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()).trim();}catch{return'';}}
export async function scrapeHotelUrl(url){const source=detectSource(url);if(source==='invalid')return{success:false,error:'الرابط غير صالح.'};if(source==='unknown')return{success:false,error:'يدعم النظام حاليًا Booking.com وAgoda وTrip.com.'};const {text,error}=await fetchViaSources(url);if(!text){const fallback=slugFallback(url);return{success:false,error:`تعذر جلب الصفحة من المصدر. ${error||''}${fallback?` اسم الفندق المستنتج من الرابط: ${fallback}. يمكنك إدخال البيانات يدويًا.`:''}`,source};}const images=extractImages(text);const title=extractTitle(text)||slugFallback(url);const shortDescription=extractDescription(text);const stars=extractStars(text);const location=extractLocation(text);if(!title&&!images.length)return{success:false,error:'لم يتم العثور على بيانات قابلة للاستخراج من الصفحة.',source};return{success:true,source,sourceUrl:url,title,shortDescription,stars,location,images,scrapedAt:new Date().toISOString()};}
export function getSourceLabel(source){return({booking:'Booking.com',trip:'Trip.com',agoda:'Agoda'})[source]||source;}
if(typeof window!=='undefined')window.FLORIN_SCRAPER={scrape:scrapeHotelUrl,test:scrapeHotelUrl,getSourceLabel};
