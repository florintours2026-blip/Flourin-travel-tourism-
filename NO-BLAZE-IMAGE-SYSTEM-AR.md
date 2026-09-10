# نظام الصور بدون Firebase Storage / Blaze

تم تعديل لوحة FLORIN لتخزين الصور المضغوطة في Cloud Firestore داخل مجموعة `media` بدل Firebase Storage.

## كيف يعمل
- المدير يختار الصور من الهاتف.
- JavaScript يضغط الصور تلقائياً إلى حجم مناسب لـ Firestore.
- كل صورة تحفظ في مستند مستقل داخل `media`.
- العرض أو البكج يحفظ مرجعاً مثل `media:ABC123`.
- صفحات العروض تفك المرجع وتعرض الصورة تلقائياً.
- صفحة `offers.html` تستخدم `onSnapshot` لتحديث العروض تلقائياً عند أي تغيير في Firestore.

## مهم
Cloud Firestore له حد لحجم المستند. لذلك الكود لا يضع كل الصور داخل مستند العرض نفسه؛ الصور تحفظ في `media` بشكل مستقل.

Firebase Storage غير مستخدم في لوحة الإدارة الجديدة، وبالتالي لا تحتاج خطة Blaze لرفع صور العروض من هذه الواجهة.

## Firebase Rules
استخدم `firestore.rules` الموجود في المشروع. يحتوي على صلاحيات مجموعة `media`.
`storage.rules` موجود فقط كملف احتياطي؛ لا تعتمد عليه في نظام الصور الجديد.

## Google
Google Sign-In يحتاج تفعيل مزود Google من Firebase Authentication وإضافة نطاق GitHub Pages إلى Authorized domains. هذا إعداد حساب Firebase وليس شيئاً يمكن لقواعد Firestore تجاوزَه.
