import { db } from './firebase-config.js';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js';

const storage=getStorage();
export async function saveBooking(data, receiptFile, passportFile){
  const refDoc=await addDoc(collection(db,'bookings'),{...data,status:'Pending',createdAt:serverTimestamp(),paymentReceiptUrl:'',passportImageUrl:''});
  const uploads={};
  if(receiptFile){const r=ref(storage,`bookings/${refDoc.id}/payment-receipt-${Date.now()}`);await uploadBytes(r,receiptFile,{contentType:receiptFile.type||'application/octet-stream'});uploads.paymentReceiptUrl=await getDownloadURL(r);}
  if(passportFile){const r=ref(storage,`bookings/${refDoc.id}/passport-${Date.now()}`);await uploadBytes(r,passportFile,{contentType:passportFile.type||'image/jpeg'});uploads.passportImageUrl=await getDownloadURL(r);}
  if(Object.keys(uploads).length) await updateDoc(doc(db,'bookings',refDoc.id),uploads);
  return refDoc.id;
}
export async function updateBookingFiles(id,files){return updateDoc(doc(db,'bookings',id),files);}
