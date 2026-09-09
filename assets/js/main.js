'use strict';
document.addEventListener('DOMContentLoaded',()=>{
 const theme=document.querySelector('#themeToggle');
 const savedTheme=localStorage.getItem('florin-theme')||'dark';
 document.body.classList.toggle('light',savedTheme==='light');
 if(theme) theme.textContent=document.body.classList.contains('light')?'☀':'◐';
 theme?.addEventListener('click',()=>{const light=!document.body.classList.contains('light');document.body.classList.toggle('light',light);localStorage.setItem('florin-theme',light?'light':'dark');theme.textContent=light?'☀':'◐';});
 const lang=document.querySelector('#langToggle');
 const current=localStorage.getItem('florin-language')||'ar';
 applyLanguage(current);
 lang?.addEventListener('click',()=>{const next=(localStorage.getItem('florin-language')||'ar')==='ar'?'en':'ar';localStorage.setItem('florin-language',next);applyLanguage(next);});
 const menu=document.querySelector('.mobile-menu'); const nav=document.querySelector('.main-nav'); menu?.addEventListener('click',()=>nav?.classList.toggle('mobile-open'));
});
function applyLanguage(lang){
 document.documentElement.lang=lang; document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 const btn=document.querySelector('#langToggle'); if(btn) btn.innerHTML=lang==='ar'?'العربية <span>EN</span>':'English <span>AR</span>';
 document.querySelectorAll('[data-ar][data-en]').forEach(el=>el.textContent=lang==='ar'?el.dataset.ar:el.dataset.en);
}
