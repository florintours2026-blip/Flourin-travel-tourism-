import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const BOOTSTRAP_ADMIN_UID = "7nE6QoTEPFOk0IhwcZUnymkyzoY2";
const statusBox = document.getElementById("loginStatus");
const googleProvider = new GoogleAuthProvider();

function setStatus(message, ok=false){ if(!statusBox)return; statusBox.hidden=false; statusBox.classList.toggle("ok",ok); statusBox.textContent=message; }
function clearStatus(){ if(statusBox){statusBox.hidden=true;statusBox.classList.remove("ok");statusBox.textContent="";} }
function errorMessage(error){
  const code=error?.code||"";
  if(["auth/invalid-credential","auth/wrong-password","auth/user-not-found"].includes(code)) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if(code==="auth/invalid-email") return "أدخل بريدًا إلكترونيًا صحيحًا.";
  if(code==="auth/too-many-requests") return "تمت محاولات كثيرة. حاول مرة أخرى لاحقًا.";
  if(code==="auth/user-disabled") return "هذا الحساب معطل.";
  if(code==="auth/popup-closed-by-user") return "تم إغلاق نافذة Google قبل إكمال الدخول.";
  if(code==="permission-denied") return "لا تملك صلاحية قراءة بيانات هذا الدور في Firestore.";
  return error?.message || "تعذر تسجيل الدخول.";
}

async function isAdmin(user){
  if(!user) return false;
  if(user.uid===BOOTSTRAP_ADMIN_UID) return true;
  const snap=await getDoc(doc(db,"admins",user.uid));
  return snap.exists() && (snap.data()?.active===true || snap.data()?.active==="true");
}

async function isEmployee(user){
  if(!user) return false;
  try{
    const employee=await getDoc(doc(db,"employees",user.uid));
    if(employee.exists() && (employee.data()?.active===true || employee.data()?.active==="true")) return true;
  }catch(error){ console.warn("employees lookup failed; trying users role",error); }
  try{
    const profile=await getDoc(doc(db,"users",user.uid));
    const role=String(profile.data()?.role||profile.data()?.accountType||"").toLowerCase();
    return profile.exists() && ["employee","staff","موظف"].includes(role) && (profile.data()?.active!==false);
  }catch(error){ console.warn("users role lookup failed",error); return false; }
}

async function continueAfterLogin(user,role){
  if(role==="client"){ location.replace("index.html"); return; }
  if(role==="admin"){
    if(await isAdmin(user)){ location.replace("admin.html"); return; }
    await signOut(auth).catch(()=>{}); throw new Error("هذا الحساب غير مصرح له بدخول الإدارة.");
  }
  if(role==="employee"){
    if(await isEmployee(user)){ location.replace("employee.html"); return; }
    await signOut(auth).catch(()=>{}); throw new Error("هذا الحساب غير مصرح له بدخول الموظفين.");
  }
}

async function submitRole(form){
  const role=form.dataset.role;
  const email=form.elements.email.value.trim();
  const password=form.elements.password.value;
  const button=form.querySelector("button[type=submit]");
  if(!email||!password){setStatus("أدخل البريد الإلكتروني وكلمة المرور.");return;}
  clearStatus(); button.disabled=true; const old=button.textContent; button.textContent="جاري تسجيل الدخول...";
  try{
    const credential=await signInWithEmailAndPassword(auth,email,password);
    await continueAfterLogin(credential.user,role);
  }catch(error){
    console.error("FLORIN login error",error);
    setStatus(errorMessage(error));
  }finally{button.disabled=false;button.textContent=old;}
}

document.querySelectorAll(".role-form").forEach(form=>form.addEventListener("submit",event=>{event.preventDefault();submitRole(form);}));

// Keep Google available only as a customer shortcut if needed later; no role ambiguity is allowed for staff/admin.
window.florinGoogleLogin=async()=>{
  try{const result=await signInWithPopup(auth,googleProvider); await continueAfterLogin(result.user,"client");}
  catch(error){setStatus(errorMessage(error));}
};

const theme=document.getElementById("themeToggle");
const saved=localStorage.getItem("florin-theme")||"dark";
document.body.classList.toggle("light",saved==="light");
if(theme)theme.textContent=saved==="light"?"☀":"◐";
theme?.addEventListener("click",()=>{const light=!document.body.classList.contains("light");document.body.classList.toggle("light",light);localStorage.setItem("florin-theme",light?"light":"dark");theme.textContent=light?"☀":"◐";});

// If a previous session is already authenticated, do not silently enter a different role.
onAuthStateChanged(auth,user=>{ if(user) console.info("FLORIN authenticated session:",user.uid); });
