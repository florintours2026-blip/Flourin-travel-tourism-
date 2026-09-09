import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
import { DEFAULT_OFFERS } from './catalog-data.js';

export { DEFAULT_OFFERS } from './catalog-data.js';

export async function loadPublicOffers(){
  try{
    const snap = await getDocs(collection(db,'offers'));
    const rows = snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false);
    return rows.length ? rows : DEFAULT_OFFERS.filter(x=>x.active!==false);
  }catch(error){
    console.warn('FLORIN: using local offer catalog', error);
    return DEFAULT_OFFERS.filter(x=>x.active!==false);
  }
}
