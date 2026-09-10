import { db } from "./firebase-config.js";

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/*==========================================================
SAVE USER
==========================================================*/

export async function saveUser(user) {
    const ref=doc(db,"users",user.uid);
    const existing=await getDoc(ref);
    const data={uid:user.uid,name:user.displayName||"",email:user.email||"",photo:user.photoURL||"",role:"client",accountType:"client",active:true,updatedAt:serverTimestamp()};
    if(!existing.exists()) data.createdAt=serverTimestamp();
    await setDoc(ref,data,{merge:true});
}


/*==========================================================
GET USER
==========================================================*/

export async function getUser(uid) {

    const document = await getDoc(doc(db, "users", uid));

    if (document.exists()) {

        return document.data();

    }

    return null;

}

/*==========================================================
UPDATE USER
==========================================================*/

export async function updateUser(uid, data) {

    await updateDoc(doc(db, "users", uid), data);

}
