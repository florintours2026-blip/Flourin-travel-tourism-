import { auth, db } from "./firebase-config.js";
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
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const googleProvider = new GoogleAuthProvider();

export async function registerUser(name, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(credential.user, { displayName: name });
  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    name: name || "",
    email: credential.user.email || email,
    photo: credential.user.photoURL || "",
    role: "customer",
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  return credential.user;
}

export async function loginUser(email, password) {
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}

export async function loginWithGoogle() {
  return (await signInWithPopup(auth, googleProvider)).user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  await signOut(auth);
}

export async function getAdminRecord(userOrUid) {
  const uid = typeof userOrUid === "string" ? userOrUid : userOrUid?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function isAdmin(userOrUid) {
  const record = await getAdminRecord(userOrUid);
  return !!record && record.active === true;
}

export function authState(callback) {
  return onAuthStateChanged(auth, callback);
}
