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

    await setDoc(doc(db, "users", user.uid), {

        uid: user.uid,

        name: user.displayName || "",

        email: user.email,

        photo: user.photoURL || "",

        createdAt: serverTimestamp()

    }, { merge: true });

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
