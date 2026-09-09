import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
const BOOTSTRAP_ADMIN_UID="7nE6QoTEPFOk0IhwcZUnymkyzoY2";
const $=id=>document.getElementById(id);
async function allowed(user){
 if(!user)return false;
 if(user.uid===BOOTSTRAP_ADMIN_UID)return false;
 try{const s=await getDoc(doc(db,"employees",user.uid)); if(s.exists()&&(s.data()?.active===true||s.data()?.active==="true"))return true;}catch{}
 try{const s=await getDoc(doc(db,"users",user.uid)); const d=s.data()||{}; const role=String(d.role||d.accountType||"").toLowerCase(); return s.exists()&&["employee","staff","موظف"].includes(role)&&d.active!==false;}catch{return false;}
}
onAuthStateChanged(auth,async user=>{try{if(!user||!(await allowed(user))){await signOut(auth).catch(()=>{});location.replace("login.html");return;} $("employeeName").textContent=user.displayName||"موظف FLORIN";$("employeeEmail").textContent=user.email||""; const t=localStorage.getItem("florin-theme")||"dark";document.body.classList.toggle("light",t==="light");}catch(e){console.error(e);location.replace("login.html");}});
$("logout")?.addEventListener("click",async()=>{await signOut(auth);location.replace("login.html");});
