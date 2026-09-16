// FLORIN Travel Catalog — seed data for the static Firebase site.
// Airport IATA codes and airline IATA codes are identifiers used for search/display.

export const AIRPORTS = [
  {iata:'CAI', city:'القاهرة', cityEn:'Cairo', country:'مصر', countryEn:'Egypt', name:'مطار القاهرة الدولي', nameEn:'Cairo International Airport'},
  {iata:'JED', city:'جدة', cityEn:'Jeddah', country:'السعودية', countryEn:'Saudi Arabia', name:'مطار الملك عبدالعزيز الدولي', nameEn:'King Abdulaziz International Airport'},
  {iata:'RUH', city:'الرياض', cityEn:'Riyadh', country:'السعودية', countryEn:'Saudi Arabia', name:'مطار الملك خالد الدولي', nameEn:'King Khalid International Airport'},
  {iata:'KUL', city:'كوالالمبور', cityEn:'Kuala Lumpur', country:'ماليزيا', countryEn:'Malaysia', name:'مطار كوالالمبور الدولي', nameEn:'Kuala Lumpur International Airport'},
  {iata:'MLE', city:'ماليه', cityEn:'Malé', country:'المالديف', countryEn:'Maldives', name:'مطار فيلانا الدولي', nameEn:'Velana International Airport'},
  {iata:'PEK', city:'بكين', cityEn:'Beijing', country:'الصين', countryEn:'China', name:'مطار بكين داشينغ/العاصمة الدولي', nameEn:'Beijing International Airport'},
  {iata:'DXB', city:'دبي', cityEn:'Dubai', country:'الإمارات', countryEn:'United Arab Emirates', name:'مطار دبي الدولي', nameEn:'Dubai International Airport'},
  {iata:'ZNZ', city:'زنجبار', cityEn:'Zanzibar', country:'تنزانيا', countryEn:'Tanzania', name:'مطار عبيد أماني كرومي الدولي', nameEn:'Abeid Amani Karume International Airport'},
  {iata:'EBB', city:'عنتيبي', cityEn:'Entebbe', country:'أوغندا', countryEn:'Uganda', name:'مطار عنتيبي الدولي', nameEn:'Entebbe International Airport'},
  {iata:'IST', city:'إسطنبول', cityEn:'Istanbul', country:'تركيا', countryEn:'Türkiye', name:'مطار إسطنبول الدولي', nameEn:'Istanbul Airport'}
];

// Airline logos: Google Favicon API (works 100% of the time)
const airlineLogo = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const AIRLINES = [
  {id:'egyptair', name:'مصر للطيران', nameEn:'EgyptAir', iata:'MS', logo:airlineLogo('egyptair.com')},
  {id:'saudia', name:'الخطوط السعودية', nameEn:'Saudia', iata:'SV', logo:airlineLogo('saudia.com')},
  {id:'emirates', name:'طيران الإمارات', nameEn:'Emirates', iata:'EK', logo:airlineLogo('emirates.com')},
  {id:'qatar', name:'الخطوط الجوية القطرية', nameEn:'Qatar Airways', iata:'QR', logo:airlineLogo('qatarairways.com')},
  {id:'turkish', name:'الخطوط الجوية التركية', nameEn:'Turkish Airlines', iata:'TK', logo:airlineLogo('turkishairlines.com')},
  {id:'ethiopian', name:'الخطوط الجوية الإثيوبية', nameEn:'Ethiopian Airlines', iata:'ET', logo:airlineLogo('ethiopianairlines.com')},
  {id:'malaysia', name:'الخطوط الجوية الماليزية', nameEn:'Malaysia Airlines', iata:'MH', logo:airlineLogo('malaysiaairlines.com')},
  {id:'airasia', name:'طيران آسيا', nameEn:'AirAsia', iata:'AK', logo:airlineLogo('airasia.com')},
  {id:'airarabia', name:'العربية للطيران', nameEn:'Air Arabia', iata:'G9', logo:airlineLogo('airarabia.com')},
  {id:'flydubai', name:'فلاي دبي', nameEn:'flydubai', iata:'FZ', logo:airlineLogo('flydubai.com')},
  {id:'oman', name:'الطيران العماني', nameEn:'Oman Air', iata:'WY', logo:airlineLogo('omanair.com')},
  {id:'gulfair', name:'طيران الخليج', nameEn:'Gulf Air', iata:'GF', logo:airlineLogo('gulfair.com')},
  {id:'kuwait', name:'الخطوط الجوية الكويتية', nameEn:'Kuwait Airways', iata:'KU', logo:airlineLogo('kuwaitairways.com')},
  {id:'royaljordanian', name:'الملكية الأردنية', nameEn:'Royal Jordanian', iata:'RJ', logo:airlineLogo('rj.com')},
  {id:'etihad', name:'الاتحاد للطيران', nameEn:'Etihad Airways', iata:'EY', logo:airlineLogo('etihad.com')},
  {id:'flynas', name:'طيران ناس', nameEn:'flynas', iata:'XY', logo:airlineLogo('flynas.com')},
  {id:'lufthansa', name:'لوفتهانزا', nameEn:'Lufthansa', iata:'LH', logo:airlineLogo('lufthansa.com')},
  {id:'airfrance', name:'الخطوط الجوية الفرنسية', nameEn:'Air France', iata:'AF', logo:airlineLogo('airfrance.com')},
  {id:'klm', name:'الخطوط الجوية الملكية الهولندية', nameEn:'KLM', iata:'KL', logo:airlineLogo('klm.com')},
  {id:'british', name:'الخطوط الجوية البريطانية', nameEn:'British Airways', iata:'BA', logo:airlineLogo('britishairways.com')},
  {id:'virgin', name:'فيرجن أتلانتيك', nameEn:'Virgin Atlantic', iata:'VS', logo:airlineLogo('virginatlantic.com')},
  {id:'swiss', name:'الخطوط الجوية السويسرية', nameEn:'SWISS', iata:'LX', logo:airlineLogo('swiss.com')},
  {id:'austrian', name:'الخطوط الجوية النمساوية', nameEn:'Austrian Airlines', iata:'OS', logo:airlineLogo('austrian.com')},
  {id:'delta', name:'دلتا إيرلاينز', nameEn:'Delta Air Lines', iata:'DL', logo:airlineLogo('delta.com')},
  {id:'united', name:'يونايتد إيرلاينز', nameEn:'United Airlines', iata:'UA', logo:airlineLogo('united.com')},
  {id:'american', name:'أمريكان إيرلاينز', nameEn:'American Airlines', iata:'AA', logo:airlineLogo('aa.com')},
  {id:'aircanada', name:'إير كندا', nameEn:'Air Canada', iata:'AC', logo:airlineLogo('aircanada.com')},
  {id:'qantas', name:'كانتاس', nameEn:'Qantas', iata:'QF', logo:airlineLogo('qantas.com')},
  {id:'singapore', name:'الخطوط الجوية السنغافورية', nameEn:'Singapore Airlines', iata:'SQ', logo:airlineLogo('singaporeair.com')},
  {id:'cathay', name:'كاثي باسيفيك', nameEn:'Cathay Pacific', iata:'CX', logo:airlineLogo('cathaypacific.com')},
  {id:'ana', name:'ANA', nameEn:'All Nippon Airways', iata:'NH', logo:airlineLogo('ana.co.jp')},
  {id:'jal', name:'الخطوط الجوية اليابانية', nameEn:'Japan Airlines', iata:'JL', logo:airlineLogo('jal.co.jp')},
  {id:'korean', name:'الخطوط الجوية الكورية', nameEn:'Korean Air', iata:'KE', logo:airlineLogo('koreanair.com')},
  {id:'thai', name:'الخطوط الجوية التايلاندية', nameEn:'Thai Airways', iata:'TG', logo:airlineLogo('thaiairways.com')},
  {id:'vietjet', name:'فيت جيت إير', nameEn:'VietJet Air', iata:'VJ', logo:airlineLogo('vietjetair.com')},
  {id:'indigo', name:'إنديجو', nameEn:'IndiGo', iata:'6E', logo:airlineLogo('goindigo.in')},
  {id:'airindia', name:'إير إنديا', nameEn:'Air India', iata:'AI', logo:airlineLogo('airindia.com')},
  {id:'pakistan', name:'الخطوط الجوية الباكستانية', nameEn:'PIA', iata:'PK', logo:airlineLogo('piac.com.pk')},
  {id:'bangladesh', name:'بيمان بنغلاديش', nameEn:'Biman Bangladesh Airlines', iata:'BG', logo:airlineLogo('biman-airlines.com')},
  {id:'srilankan', name:'الخطوط الجوية السريلانكية', nameEn:'SriLankan Airlines', iata:'UL', logo:airlineLogo('srilankan.com')},
  {id:'kenya', name:'الخطوط الجوية الكينية', nameEn:'Kenya Airways', iata:'KQ', logo:airlineLogo('kenya-airways.com')},
  {id:'southafrican', name:'الخطوط الجوية لجنوب أفريقيا', nameEn:'South African Airways', iata:'SA', logo:airlineLogo('flysaa.com')},
  {id:'royalairmaroc', name:'الخطوط الملكية المغربية', nameEn:'Royal Air Maroc', iata:'AT', logo:airlineLogo('royalairmaroc.com')},
  {id:'rwandair', name:'رواندا إير', nameEn:'RwandAir', iata:'WB', logo:airlineLogo('rwandair.com')},
  {id:'uganda', name:'خطوط طيران أوغندا', nameEn:'Uganda Airlines', iata:'UR', logo:airlineLogo('ugandairlines.com')},
  {id:'airchina', name:'إير تشاينا', nameEn:'Air China', iata:'CA', logo:airlineLogo('airchina.com')},
  {id:'chinaeastern', name:'تشاينا إيسترن', nameEn:'China Eastern', iata:'MU', logo:airlineLogo('ceair.com')},
  {id:'chinasouthern', name:'تشاينا ساذرن', nameEn:'China Southern', iata:'CZ', logo:airlineLogo('csair.com')},
  {id:'hainan', name:'هاينان إيرلاينز', nameEn:'Hainan Airlines', iata:'HU', logo:airlineLogo('hnair.com')},
  {id:'eva', name:'إيفا للطيران', nameEn:'EVA Air', iata:'BR', logo:airlineLogo('evaair.com')},
  {id:'garuda', name:'جارودا إندونيسيا', nameEn:'Garuda Indonesia', iata:'GA', logo:airlineLogo('garuda-indonesia.com')}
];

const routeImages = {
  CAI_KUL:'assets/images/destination/kuala-lumpur.webp',
  CAI_JED:'assets/images/destination/sharm.webp',
  CAI_RUH:'assets/images/destination/sharm.webp',
  CAI_MLE:'assets/images/destination/maldives.webp',
  CAI_PEK:'assets/images/destination/kuala-lumpur.webp',
  CAI_DXB:'assets/images/destination/dahab.webp',
  CAI_ZNZ:'assets/images/destination/maldives.webp',
  CAI_EBB:'assets/images/destination/dahab.webp',
  JED_KUL:'assets/images/destination/kuala-lumpur.webp',
  CAI_IST:'assets/images/destination/dahab.webp'
};

const makeFlight = (id, from, to, airlineId, price, cabin, baggage, duration, imageKey, stopover='مباشر', discount=null) => ({
  id, type:'flight', category:'رحلات طيران', name:`رحلة ${from} إلى ${to} — ${airlineId.toUpperCase()}`,
  fromIata:from, toIata:to, fromName:'', toName:'', airlineId, price, currency:'USD', cabin,
  baggage, duration, stopover, image:routeImages[imageKey], images:[routeImages[imageKey]], active:true, order:0,
  discount: discount || {enabled:false,type:'percent',value:0,label:''},
  description:`عرض طيران من ${from} إلى ${to}. السعر المعروض مبدئي ويؤكد نهائيًا حسب تاريخ السفر والتوفر.`,
  notes:'التوفر والسعر النهائيان يعتمدان على تاريخ السفر ودرجة الحجز وسياسة شركة الطيران.'
});

export const DEFAULT_FLIGHT_OFFERS = [
  makeFlight('flt-cai-kul-01','CAI','KUL','qatar',540,'اقتصادية','30 كجم','10س 40د','CAI_KUL'),
  makeFlight('flt-cai-kul-02','CAI','KUL','emirates',610,'اقتصادية','30 كجم','11س 20د','CAI_KUL','توقف واحد'),
  makeFlight('flt-cai-jed-01','CAI','JED','egyptair',185,'اقتصادية','23 كجم','2س 10د','CAI_JED'),
  makeFlight('flt-cai-jed-02','CAI','JED','saudia',205,'اقتصادية','23 كجم','2س 15د','CAI_JED'),
  makeFlight('flt-cai-ruh-01','CAI','RUH','egyptair',220,'اقتصادية','23 كجم','2س 40د','CAI_RUH'),
  makeFlight('flt-cai-ruh-02','CAI','RUH','saudia',235,'اقتصادية','23 كجم','2س 35د','CAI_RUH'),
  makeFlight('flt-cai-mle-01','CAI','MLE','qatar',520,'اقتصادية','30 كجم','10س 15د','CAI_MLE','توقف واحد'),
  makeFlight('flt-cai-mle-02','CAI','MLE','emirates',585,'اقتصادية','30 كجم','10س 30د','CAI_MLE','توقف واحد'),
  makeFlight('flt-cai-pek-01','CAI','PEK','qatar',650,'اقتصادية','30 كجم','11س 45د','CAI_PEK','توقف واحد'),
  makeFlight('flt-cai-pek-02','CAI','PEK','emirates',720,'اقتصادية','30 كجم','12س 05د','CAI_PEK','توقف واحد'),
  makeFlight('flt-cai-dxb-01','CAI','DXB','emirates',210,'اقتصادية','25 كجم','3س 20د','CAI_DXB'),
  makeFlight('flt-cai-dxb-02','CAI','DXB','egyptair',195,'اقتصادية','23 كجم','3س 10د','CAI_DXB'),
  makeFlight('flt-cai-znz-01','CAI','ZNZ','qatar',575,'اقتصادية','30 كجم','10س 20د','CAI_ZNZ','توقف واحد'),
  makeFlight('flt-cai-znz-02','CAI','ZNZ','ethiopian',495,'اقتصادية','23 كجم','8س 50د','CAI_ZNZ','توقف واحد'),
  makeFlight('flt-cai-ebb-01','CAI','EBB','ethiopian',450,'اقتصادية','23 كجم','8س 20د','CAI_EBB','توقف واحد'),
  makeFlight('flt-cai-ebb-02','CAI','EBB','qatar',510,'اقتصادية','30 كجم','9س 30د','CAI_EBB','توقف واحد'),
  makeFlight('flt-jed-kul-01','JED','KUL','saudia',690,'اقتصادية','30 كجم','9س 15د','JED_KUL','توقف واحد'),
  makeFlight('flt-jed-kul-02','JED','KUL','qatar',710,'اقتصادية','30 كجم','10س 00د','JED_KUL','توقف واحد'),
  makeFlight('flt-cai-ist-01','CAI','IST','turkish',310,'اقتصادية','23 كجم','2س 20د','CAI_IST'),
  makeFlight('flt-cai-ist-02','CAI','IST','egyptair',295,'اقتصادية','23 كجم','2س 15د','CAI_IST')
];

export const DEFAULT_HOTEL_OFFERS = [
  {id:'hotel-dubai-01',type:'hotel',category:'فنادق',name:'JW Marriott Marquis Dubai',country:'الإمارات',destination:'دبي',duration:'4 ليالٍ',price:780,currency:'USD',image:'assets/images/hotels/dubai-hotel.webp',images:['assets/images/hotels/dubai-hotel.webp'],hotel:{name:'JW Marriott Marquis Dubai',stars:5,rooms:['غرفة ديلوكس','جناح تنفيذي'],amenities:['مسبح','سبا','مطاعم','واي فاي']},active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'hotel-maldives-01',type:'hotel',category:'فنادق',name:'منتجع المالديف الفاخر',country:'المالديف',destination:'المالديف',duration:'4 ليالٍ',price:1250,currency:'USD',image:'assets/images/hotels/maldives-resort.webp',images:['assets/images/hotels/maldives-resort.webp'],hotel:{name:'منتجع فاخر في المالديف',stars:5,rooms:['فيلا شاطئية','فيلا فوق الماء'],amenities:['شاطئ خاص','مسبح','رياضات مائية','سبا']},active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'hotel-istanbul-01',type:'hotel',category:'فنادق',name:'فندق فاخر في إسطنبول',country:'تركيا',destination:'إسطنبول',duration:'5 ليالٍ',price:620,currency:'USD',image:'assets/images/offers/cleaned/istanbul-offer-clean.png',images:['assets/images/offers/cleaned/istanbul-offer-clean.png'],hotel:{name:'فندق 5 نجوم في إسطنبول',stars:5,rooms:['غرفة ديلوكس','جناح'],amenities:['سبا','مطاعم','واي فاي']},active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'hotel-sharm-01',type:'hotel',category:'فنادق',name:'منتجع شرم الشيخ',country:'مصر',destination:'شرم الشيخ',duration:'4 ليالٍ',price:390,currency:'USD',image:'assets/images/hotels/sharm-hotel.webp',images:['assets/images/hotels/sharm-hotel.webp'],hotel:{name:'منتجع 5 نجوم في شرم الشيخ',stars:5,rooms:['غرفة مطلة على الحديقة','غرفة مطلة على البحر'],amenities:['شاطئ','مسابح','غوص','مطاعم']},active:true,discount:{enabled:false,type:'percent',value:0,label:''}}
];

const EXTRA_HOTEL_OFFERS = [
  {id:'hotel-dubai-02',type:'hotel',category:'فنادق',name:'فندق شاطئي فاخر في دبي',country:'الإمارات',destination:'دبي',duration:'4 ليالٍ',price:920,currency:'USD',image:'assets/images/offers/cleaned/dubai-offer-clean.png',images:['assets/images/offers/cleaned/dubai-offer-clean.png'],hotel:{name:'فندق 5 نجوم في دبي',stars:5,rooms:['غرفة مطلة على المدينة','جناح تنفيذي'],amenities:['مسبح','شاطئ قريب','مطاعم','نقل']},active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'hotel-maldives-02',type:'hotel',category:'فنادق',name:'فيلا شاطئية خاصة في المالديف',country:'المالديف',destination:'المالديف',duration:'5 ليالٍ',price:1450,currency:'USD',image:'assets/images/offers/cleaned/maldives-offer-clean.png',images:['assets/images/offers/cleaned/maldives-offer-clean.png'],hotel:{name:'منتجع 5 نجوم في المالديف',stars:5,rooms:['فيلا شاطئية بمسبح','فيلا فوق الماء'],amenities:['شاطئ خاص','مسبح خاص','سبا','قوارب']},active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'hotel-istanbul-02',type:'hotel',category:'فنادق',name:'إقامة البوسفور — إسطنبول',country:'تركيا',destination:'إسطنبول',duration:'5 ليالٍ',price:740,currency:'USD',image:'assets/images/offers/cleaned/istanbul-offer-clean.png',images:['assets/images/offers/cleaned/istanbul-offer-clean.png'],hotel:{name:'فندق 5 نجوم بإطلالة المدينة',stars:5,rooms:['غرفة بوسفور','جناح عائلي'],amenities:['إطلالة','سبا','مطاعم','واي فاي']},active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'hotel-sharm-02',type:'hotel',category:'فنادق',name:'منتجع عائلي في شرم الشيخ',country:'مصر',destination:'شرم الشيخ',duration:'5 ليالٍ',price:460,currency:'USD',image:'assets/images/offers/cleaned/egypt-offer-clean.png',images:['assets/images/offers/cleaned/egypt-offer-clean.png'],hotel:{name:'منتجع 5 نجوم عائلي',stars:5,rooms:['غرفة عائلية','جناح عائلي'],amenities:['شاطئ','ألعاب مائية','مسابح','مطاعم']},active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'hotel-makkah-02',type:'hotel',category:'فنادق',name:'إقامة قريبة من الحرم — مكة',country:'السعودية',destination:'مكة المكرمة',duration:'4 ليالٍ',price:890,currency:'USD',image:'assets/images/offers/cleaned/makkah-offer-clean.png',images:['assets/images/offers/cleaned/makkah-offer-clean.png'],hotel:{name:'فندق فاخر قريب من الحرم',stars:5,rooms:['غرفة ديلوكس','جناح'],amenities:['قرب من الحرم','مطاعم','واي فاي','خدمة غرف']},active:true,discount:{enabled:false,type:'percent',value:0,label:''}}
];

const EXTRA_TOUR_OFFERS = [
  {id:'tour-dubai-01',type:'tour',category:'رحلات سياحية',name:'جولة دبي — معالم المدينة والصحراء',country:'الإمارات',destination:'دبي',duration:'5 أيام',price:650,currency:'USD',image:'assets/images/offers/cleaned/dubai-offer-clean.png',images:['assets/images/offers/cleaned/dubai-offer-clean.png'],description:'برنامج سياحي قابل للتعديل يشمل جولات المدينة وتجربة الصحراء حسب الطلب.',active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'tour-maldives-01',type:'tour',category:'رحلات سياحية',name:'المالديف — برنامج استرخاء وجزر',country:'المالديف',destination:'المالديف',duration:'5 أيام',price:990,currency:'USD',image:'assets/images/offers/cleaned/maldives-offer-clean.png',images:['assets/images/offers/cleaned/maldives-offer-clean.png'],description:'برنامج جزر وأنشطة بحرية قابل للتخصيص حسب نوع الإقامة.',active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'tour-istanbul-01',type:'tour',category:'رحلات سياحية',name:'إسطنبول — البوسفور والمدينة القديمة',country:'تركيا',destination:'إسطنبول',duration:'6 أيام',price:730,currency:'USD',image:'assets/images/offers/cleaned/istanbul-offer-clean.png',images:['assets/images/offers/cleaned/istanbul-offer-clean.png'],description:'جولات في إسطنبول مع إمكانية إضافة الطيران والفندق والنقل.',active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'tour-sharm-01',type:'tour',category:'رحلات سياحية',name:'شرم الشيخ — بحر وغوص وسفاري',country:'مصر',destination:'شرم الشيخ',duration:'5 أيام',price:420,currency:'USD',image:'assets/images/offers/cleaned/egypt-offer-clean.png',images:['assets/images/offers/cleaned/egypt-offer-clean.png'],description:'برنامج عائلي أو مغامرات بحرية وسفاري مع خيارات فندق وطيران.',active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'tour-makkah-01',type:'tour',category:'رحلات سياحية',name:'مكة والمدينة — برنامج زيارة',country:'السعودية',destination:'مكة المكرمة',duration:'حسب البرنامج',price:0,currency:'SAR',image:'assets/images/offers/cleaned/makkah-offer-clean.png',images:['assets/images/offers/cleaned/makkah-offer-clean.png'],description:'برنامج قابل للتخصيص، يحدد السعر بعد اختيار الفندق والطيران والمدة.',active:true,discount:{enabled:false,type:'percent',value:0,label:''}}
];

export const DEFAULT_SERVICE_OFFERS = [
  {id:'service-umrah',type:'service',category:'عمرة',name:'عمرة — إنجاز خلال 24–72 ساعة',destination:'مكة المكرمة',price:1400,currency:'SAR',description:'خدمة عمرة قابلة للتخصيص حسب البرنامج والتوفر.',image:'assets/images/offers/cleaned/makkah-offer-clean.png',images:['assets/images/offers/cleaned/makkah-offer-clean.png'],active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'service-security',type:'service',category:'خدمات سفر',name:'الموافقة الأمنية لمصر',destination:'مصر',price:130,currency:'USD',description:'خدمة متابعة الموافقة الأمنية وفق المتطلبات المعتمدة.',image:'assets/images/offers/cleaned/egypt-security-offer-clean.png',images:['assets/images/offers/cleaned/egypt-security-offer-clean.png'],active:true,discount:{enabled:false,type:'percent',value:0,label:''}},
  {id:'service-family-visit',type:'service',category:'خدمات سفر',name:'تخليص إجراءات الزيارة العائلية بمصر',destination:'مصر',price:9800,currency:'EGP',description:'تقديم ومتابعة طلب الزيارة العائلية وفق المستندات المطلوبة.',image:'assets/images/offers/cleaned/egypt-offer-clean.png',images:['assets/images/offers/cleaned/egypt-offer-clean.png'],active:true,discount:{enabled:false,type:'percent',value:0,label:''}}
];

export const DEFAULT_OFFERS = [...DEFAULT_FLIGHT_OFFERS,...DEFAULT_HOTEL_OFFERS,...EXTRA_HOTEL_OFFERS,...EXTRA_TOUR_OFFERS,...DEFAULT_SERVICE_OFFERS];

export const EMPTY_TOUR_PACKAGE = {
  id:'', type:'tour', category:'بكجات سياحية', name:'', country:'', destination:'', duration:'', price:'', currency:'USD',
  image:'', images:[], description:'', itinerary:'', included:[], excluded:[], airlineId:'', flightOfferId:'', hotelName:'', hotelStars:5,
  active:false, discount:{enabled:false,type:'percent',value:0,label:''}
};
