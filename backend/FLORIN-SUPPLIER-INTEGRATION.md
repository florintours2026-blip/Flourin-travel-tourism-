# FLORIN supplier integration

هذه الإضافة تحول FLORIN من كتالوج أسعار ثابتة إلى بنية قابلة لربط مصادر السفر الحية.

## 1. الفنادق

المصادر المطلوبة:
- Booking.com
- Trip.com
- Agoda

هناك نوعان من الاستيراد:

### استيراد رابط
يقبل رابط الفندق ويستخرج البيانات العامة مثل:
- الاسم
- الوصف
- الصور
- المصدر
- الرابط

ثم يمكن تمرير البيانات إلى DeepSeek للتوحيد.

**مهم:** لا نعتبر السعر الموجود في HTML سعرًا حيًا موثوقًا. السعر الحي يجب أن يأتي من API/شراكة المصدر.

### بحث حي
`POST /api/hotels/search`

يدعم:
- booking
- agoda
- trip

Booking.com تم توصيله ببنية Demand API عندما تكون بيانات الشريك متوفرة.
Agoda وTrip.com لهما adapters قابلة للإعداد بعد تزويد FLORIN ببيانات الشراكة/الـ API.

## 2. الطيران

المشروع الحالي يحتوي على قائمة شركات الطيران واللوجوهات داخل `catalog-data.js`.

تم فصل "شركة الطيران" عن "مصدر السعر":

- اللوجو = هوية الناقل.
- API/NDC = مصدر السعر والتوفر.

لا ينبغي استخدام اللوجو أو موقع الشركة العام كطريقة لجلب سعر حي.

يمكن ضبط كل شركة عبر `AIRLINE_API_CONFIG` في `.env`.
مثال:

```env
AIRLINE_API_CONFIG={"egyptair":{"base_url":"https://YOUR-ENDPOINT","type":"ndc","api_key":"SERVER_SECRET"}}
```

ثم:

`POST /api/flights/search`

## 3. قاعدة البيانات

يُحفظ المنتج في Firestore collection:

```text
offers
```

وهو نفس الـ collection الذي يستخدمه FLORIN الحالي، لذلك لا نحتاج إنشاء catalog جديد.

## 4. تشغيل الـ API

```bash
pip install -r requirements-florin-api.txt
uvicorn florin_travel_api:app --reload --port 8000
```

ثم ضع:

```js
window.FLORIN_API_BASE_URL = 'http://localhost:8000';
```

في صفحة الإدارة.

## 5. Firebase

أنشئ Service Account في Firebase Console، ثم ضع مساره في:

```env
FIREBASE_SERVICE_ACCOUNT_FILE=/path/to/service-account.json
```

لا ترفع هذا الملف إلى GitHub.

## 6. ملاحظة تجارية

Booking.com Demand API يتطلب Managed Affiliate Partner + API token + X-Affiliate-Id.

Agoda يتطلب الشراكة وبيانات الاعتماد/التصديق.

Trip.com يوفر برامج ومداخل تكامل للشركاء.

بالنسبة للطيران، استخدم NDC أو API مصرحًا به من شركة الطيران أو مزود توزيع متعاقد معه.
