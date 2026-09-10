import { db } from './firebase-config.js';
import { collection, getDocs, getDoc, doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
import { DEFAULT_OFFERS } from './catalog-data.js';
export { DEFAULT_OFFERS } from './catalog-data.js';

async function resolveMedia(value){
  if(typeof value!=='string' || !value.startsWith('media:')) return value||'';
  try{ const s=await getDoc(doc(db,'media',value.slice(6))); return s.exists()?String(s.data()?.data||''):''; }catch(e){ console.warn('FLORIN media:',e); return ''; }
}
async function hydrate(row){
  const images=Array.isArray(row.images)?row.images:[];
  const resolved=await Promise.all(images.map(resolveMedia));
  return {...row,image:await resolveMedia(row.image),images:resolved.filter(Boolean)};
}
export async function loadPublicOffers(){
  try{
    const snap=await getDocs(collection(db,'offers'));
    const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false);
    return rows.length?await Promise.all(rows.map(hydrate)):DEFAULT_OFFERS.filter(x=>x.active!==false);
  }catch(error){ console.warn('FLORIN: using local offer catalog',error); return DEFAULT_OFFERS.filter(x=>x.active!==false); }
}
export async function getOffer(id){
  try{ const s=await getDoc(doc(db,'offers',id)); if(!s.exists()) return null; const o={id:s.id,...s.data()}; if(o.active===false)return null; return await hydrate(o); }catch(e){ console.warn('FLORIN getOffer:',e); return null; }
}

export function subscribePublicOffers(callback){
  return onSnapshot(collection(db,'offers'),async snap=>{
    const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false);
    callback(rows.length?await Promise.all(rows.map(hydrate)):DEFAULT_OFFERS.filter(x=>x.active!==false));
  },error=>{console.warn('FLORIN realtime offers:',error);callback(DEFAULT_OFFERS.filter(x=>x.active!==false));});
}
