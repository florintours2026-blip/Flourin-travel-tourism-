# FLORIN — تثبيت Authentication + Admin

## 1. Firebase Authentication
فعّل Email/Password في Firebase Authentication، ويمكنك تفعيل Google إذا أردت.

## 2. إنشاء أول مدير
أنشئ حساب المدير من `register.html`. من Firebase Authentication انسخ UID. ثم Firestore:

- Collection: `admins`
- Document ID: **UID نفسه**
- `active`: `true` (Boolean)
- `role`: `super_admin`
- `name`: اسم المدير
- `email`: بريد المدير
- `uid`: UID

لا يمكن للعميل إنشاء أو ترقية نفسه مديرًا من الموقع.

## 3. نشر القواعد
انسخ محتوى `firestore.rules` إلى Firebase Console → Firestore Database → Rules ثم Publish.
وانسخ `storage.rules` إلى Storage → Rules ثم Publish.

## 4. دخول الإدارة
من الموقع اضغط **دخول الإدارة** أو افتح `login.html?admin=1`. بعد تسجيل الدخول يتم التحقق من `admins/{UID}` ثم فتح `admin.html`.

## 5. إذا ظهرت Missing or insufficient permissions
هذا يعني غالبًا أن قواعد Firestore المنشورة ليست نسخة المشروع الحالية. أعد نشر `firestore.rules` وانتظر اكتمال النشر ثم سجّل الخروج والدخول.


## إصلاح إضافي في هذه النسخة
تم اعتماد UID المدير التالي كمدير تأسيسي داخل التطبيق والقواعد: `7nE6QoTEPFOk0IhwcZUnymkyzoY2`.
لذلك إذا كان هذا هو UID لحساب المدير المسجّل في Firebase Authentication، فسيعمل الدخول حتى لو كان مستند `admins/7nE6QoTEPFOk0IhwcZUnymkyzoY2` مفقودًا. يظل إنشاء مستند admins موصى به لإدارة الأدوار لاحقًا.
