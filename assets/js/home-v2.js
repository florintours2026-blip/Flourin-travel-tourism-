import { authState } from './auth.js';
authState(user=>{const name=user?.displayName?.trim()||user?.email?.split('@')[0]||'';const g=document.querySelector('#homeGreeting');if(g)g.textContent=name?`مرحبًا ${name} 👋 يمكنك متابعة طلباتك من حسابك.`:'سجّل الدخول ليظهر اسمك في الموقع.';});
