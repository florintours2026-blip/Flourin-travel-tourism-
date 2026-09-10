import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail, signOut, updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
const googleProvider=new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt:'select_account'});
export async function registerUser(name,email,password){const c=await createUserWithEmailAndPassword(auth,email,password);if(name)await updateProfile(c.user,{displayName:name});return c.user;}
export async function loginUser(email,password){return (await signInWithEmailAndPassword(auth,email,password)).user;}
export async function loginWithGoogle(){
  if(/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) { await signInWithRedirect(auth,googleProvider); return null; }
  return (await signInWithPopup(auth,googleProvider)).user;
}
export async function getGoogleRedirectResult(){try{const r=await getRedirectResult(auth);return r?.user||null;}catch(e){console.error('Google redirect:',e);throw e;}}
export async function resetPassword(email){return sendPasswordResetEmail(auth,email);}
export async function logoutUser(){return signOut(auth);}
export function authState(callback){return onAuthStateChanged(auth,callback);}
