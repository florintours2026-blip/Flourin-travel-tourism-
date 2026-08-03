import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

export async function saveBooking(data) {

    await addDoc(

        collection(db, "bookings"),

        {

            ...data,

            status: "Pending",

            createdAt: serverTimestamp()

        }

    );

}
