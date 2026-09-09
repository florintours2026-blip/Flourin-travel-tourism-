# إصلاح لوحة إدارة FLORIN

تم إصلاح Authentication + Admin في هذه النسخة.

## السبب الرئيسي
لوحة الإدارة كانت تعتمد بالكامل على وجود:
`admins/{UID}`
مع:
`active = true` كقيمة Boolean.

إذا كان المستند مفقودًا أو كانت `active` نصًا مثل `"true"` فسيُرفض الدخول، كما أن اللوحة كانت تبقى في شاشة التحقق عند فشل القراءة.

## ما تم إصلاحه
- اعتماد UID المدير التأسيسي الموجود في المشروع: `7nE6QoTEPFOk0IhwcZUnymkyzoY2`.
- `admin-v2.js` أصبح يتحقق من UID التأسيسي أو مستند admins.
- `login.js` يستخدم نفس منطق صلاحية المدير.
- `navbar-auth.js` يستخدم نفس المنطق.
- إضافة مهلة 12 ثانية بدل بقاء صفحة الإدارة في "جاري التحقق" إلى أجل غير محدد.
- تحسين رسالة خطأ لوحة الإدارة.
- `firestore.rules` و`storage.rules` محدثان لدعم UID التأسيسي وقيمة active Boolean أو string.
- إصلاح `register.html`: حقل تأكيد كلمة المرور كان معرفه `confirmكلمة المرور` بينما JavaScript يبحث عن `confirmPassword`.
- إصلاح مسار شعار FLORIN في login/register.

## مهم جدًا بعد رفع المشروع
يجب نشر النسختين الجديدتين من القواعد من Firebase Console:
1. Firestore Database → Rules → استبدال المحتوى بملف `firestore.rules` → Publish.
2. Storage → Rules → استبدال المحتوى بملف `storage.rules` → Publish.

ثم:
1. افتح `login.html?admin=1`.
2. سجّل الدخول بالحساب الذي UID الخاص به `7nE6QoTEPFOk0IhwcZUnymkyzoY2`.
3. بعد النجاح ستفتح `admin.html`.
4. يفضل إنشاء `admins/7nE6QoTEPFOk0IhwcZUnymkyzoY2` في Firestore مع `active: true` و`role: super_admin` للاستمرار بإدارة الصلاحيات من قاعدة البيانات.

لا تضع كلمة مرور Firebase أو أي مفتاح سري داخل الملفات. Firebase Web API key الظاهر في `firebase-config.js` ليس بديلًا عن Authentication وقواعد Firestore/Storage.
