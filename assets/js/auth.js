import { auth } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();

/*==========================================================
REGISTER
==========================================================*/

export async function registerUser(name, email, password){

    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    await updateProfile(userCredential.user,{
        displayName:name
    });

    return userCredential.user;

}

/*==========================================================
LOGIN
==========================================================*/

export async function loginUser(email,password){

    const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    return userCredential.user;

}

/*==========================================================
GOOGLE LOGIN
==========================================================*/

export async function loginWithGoogle(){

    const result = await signInWithPopup(
        auth,
        googleProvider
    );

    return result.user;

}

/*==========================================================
RESET PASSWORD
==========================================================*/

export async function resetPassword(email){

    await sendPasswordResetEmail(auth,email);

}

/*==========================================================
LOGOUT
==========================================================*/

export async function logoutUser(){

    await signOut(auth);

}

/*==========================================================
AUTH STATE
==========================================================*/

export function authState(callback){

    onAuthStateChanged(auth,callback);

}
