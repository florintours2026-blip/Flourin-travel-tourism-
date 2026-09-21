'use strict';

const DICT = {
  'الرئيسية':'Home','حجوزات الطيران':'Flights','حجز الفنادق':'Hotels','خدمات التأشيرات':'Visas','البرامج السياحية':'Tour Packages','تواصل معنا':'Contact Us','لوحة الإدارة':'Admin Panel',
  'طيران':'Flights','فنادق':'Hotels','تأشيرات':'Visas','ابحث الآن':'Search Now','من':'From','إلى':'To','تاريخ السفر':'Travel Date','المسافرون':'Travelers','القاهرة':'Cairo','دبي':'Dubai',
  'خدماتنا':'Our Services','عالم أقرب إليك — نرتب لك رحلتك من البداية حتى الوصول':'A world closer to you — we arrange your journey from start to arrival','وكالة معتمدة لخدمات السفر':'Certified Travel Services Agency',
  'التفاصيل وطلب الحجز':'Details & Request Booking','اطلب الحجز':'Request Booking','لا توجد عروض مطابقة.':'No matching offers found.','لا توجد رحلات مطابقة. جرّب كود مطار مثل CAI أو JED.':'No matching flights. Try an airport code such as CAI or JED.',
  'كل الخدمات':'All Services','جاري التحميل...':'Loading...','إرسال الطلب':'Send Request','جاري إرسال الطلب...':'Sending request...','بيانات العميل':'Customer Information','تفاصيل الرحلة أو الخدمة':'Trip or Service Details',
  'الاسم الكامل *':'Full Name *','الهاتف / واتساب *':'Phone / WhatsApp *','البريد الإلكتروني':'Email','دولة الإقامة':'Country of Residence','الخدمة *':'Service *','اختر الخدمة':'Choose a service','الوجهة':'Destination','عدد المسافرين':'Travelers','تفاصيل إضافية':'Additional Details',
  'حجز طيران':'Flight Booking','حجز فندق':'Hotel Booking','بكج سياحي':'Tour Package','عمرة':'Umrah','تأشيرة':'Visa','موافقة أمنية':'Security Approval','زيارة عائلية بمصر':'Family Visit to Egypt',
  'المظهر':'Appearance','اللغة':'Language','سجّل الدخول':'Sign in','مستخدم':'User','العربية':'Arabic','English':'English','العودة':'Back','العودة إلى التأشيرات':'Back to Visas',
  'التفاصيل':'Details','ابدأ طلب التأشيرة':'Start Visa Request','التأشيرات الإلكترونية':'e-Visas','تأشيرات السفر بأسعار واضحة':'Travel visas with clear pricing',
  'البكجات السياحية':'Tour Packages','إضافة بكج':'Add Package','إضافة عرض جديد':'Add New Offer','تعديل العرض':'Edit Offer','حفظ':'Save','إلغاء':'Cancel','استيراد':'Import','استيراد بيانات الفندق':'Import Hotel Data'
};
const REVERSE = Object.fromEntries(Object.entries(DICT).map(([a,e])=>[e,a]));

function translateTextValue(value, lang){
  const raw=String(value ?? '');
  const trimmed=raw.trim();
  if(!trimmed) return raw;
  if(lang==='en'){
    if(DICT[trimmed]) return raw.replace(trimmed,DICT[trimmed]);
    if(trimmed.startsWith('العرض المختار:')) return raw.replace(/^العرض المختار:/,'Selected offer:');
    if(trimmed.startsWith('مرحبًا')) return raw.replace(/^مرحبًا/,'Welcome');
  } else {
    if(REVERSE[trimmed]) return raw.replace(trimmed,REVERSE[trimmed]);
    if(trimmed.startsWith('Selected offer:')) return raw.replace(/^Selected offer:/,'العرض المختار:');
    if(trimmed.startsWith('Welcome')) return raw.replace(/^Welcome/,'مرحبًا');
  }
  return raw;
}

function translateNode(node, lang){
  if(node.nodeType===Node.TEXT_NODE){
    const old=node.nodeValue;
    const next=translateTextValue(old,lang);
    if(next!==old) node.nodeValue=next;
    return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE) return;
  ['placeholder','title','aria-label'].forEach(attr=>{
    if(node.hasAttribute(attr)){
      const old=node.getAttribute(attr), next=translateTextValue(old,lang);
      if(next!==old) node.setAttribute(attr,next);
    }
  });
  node.childNodes.forEach(ch=>translateNode(ch,lang));
}

function applyLanguage(lang){
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  const btn=document.querySelector('#langToggle');
  if(btn) btn.innerHTML=lang==='ar'?'<i class="fa-solid fa-globe"></i> <span>EN</span>':'<i class="fa-solid fa-globe"></i> <span>AR</span>';
  document.querySelectorAll('[data-ar][data-en]').forEach(el=>el.textContent=lang==='ar'?el.dataset.ar:el.dataset.en);
  translateNode(document.body,lang);
  document.dispatchEvent(new CustomEvent('florin-language-changed',{detail:{lang}}));
}

function setupSearch(){
  const tabs=[...document.querySelectorAll('.search-tabs .tab')];
  const form=document.querySelector('#searchForm');
  if(!tabs.length) return;
  tabs.forEach(tab=>tab.addEventListener('click',()=>{
    tabs.forEach(t=>t.classList.remove('active')); tab.classList.add('active');
    const active=tab.dataset.tab;
    const from=form?.querySelector('input:nth-of-type(1)');
    if(form) form.dataset.activeTab=active;
  }));
  form?.addEventListener('submit',e=>{
    e.preventDefault();
    const active=form.dataset.activeTab || tabs.find(t=>t.classList.contains('active'))?.dataset.tab || 'flights';
    if(active==='visas') location.href='visas.html';
    else if(active==='hotels') location.href='offers.html';
    else location.href='flights.html';
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  const theme=document.querySelector('#themeToggle');
  const savedTheme=localStorage.getItem('florin-theme')||'dark';
  document.body.classList.toggle('light',savedTheme==='light');
  if(theme) theme.innerHTML=document.body.classList.contains('light')?'<i class="fa-solid fa-sun"></i>':'<i class="fa-solid fa-moon"></i>';
  theme?.addEventListener('click',()=>{const light=!document.body.classList.contains('light');document.body.classList.toggle('light',light);localStorage.setItem('florin-theme',light?'light':'dark');theme.innerHTML=light?'<i class="fa-solid fa-sun"></i>':'<i class="fa-solid fa-moon"></i>';});
  const lang=document.querySelector('#langToggle');
  const current=localStorage.getItem('florin-language')||'ar';
  applyLanguage(current);
  lang?.addEventListener('click',()=>{const next=(localStorage.getItem('florin-language')||'ar')==='ar'?'en':'ar';localStorage.setItem('florin-language',next);applyLanguage(next);});
  const menu=document.querySelector('.mobile-menu'); const nav=document.querySelector('.main-nav');
  menu?.addEventListener('click',()=>{nav?.classList.toggle('mobile-open');nav?.classList.toggle('open');});
  setupSearch();
  window.FLORIN_APPLY_LANGUAGE=applyLanguage;
});
