# FLORIN — Architecture

## Collections
- `offers`: رحلات، فنادق، خدمات.
- `tourPackages`: البكجات السياحية.
- `airlines`: شركات الطيران واللوقوهات.
- `bookings`: طلبات العملاء.
- `users`: حسابات العملاء.
- `admins`: صلاحيات الإدارة.

## Storage
- `offers/{offerId}/...`
- `packages/{packageId}/...`
- `airlines/{airlineId}/...`

## أهم الملفات
- `assets/js/catalog-data.js`: المطارات، شركات الطيران، 20 عرض طيران، عروض الفنادق والخدمات.
- `assets/js/flights.js`: بحث IATA وعرض الرحلات.
- `assets/js/offers.js`: تجميع العروض حسب الوجهة.
- `assets/js/booking.js`: إرسال طلب الحجز.
- `assets/js/admin-v2.js`: إدارة العروض، الخصومات، الصور، شركات الطيران، البكجات، الحجوزات.
- `assets/css/florin-v2.css`: الهوية الجديدة للواجهة.
- `assets/css/admin-v2.css`: واجهة الإدارة.

## دورة الحجز
العميل يبحث → يختار العرض → يرسل الطلب → Firestore → المدير يرى الطلب → المدير يغيّر الحالة → يتم التواصل مع العميل للتأكيد.
