# FLORIN — Real hotel photo package update

This version removes the previous fake/generated package hotel images and replaces the starter package records with real hotel photography loaded from real hotel/gallery sources.

## Starter hotels
- Dubai: Four Points by Sheraton Bur Dubai — 4 stars
- Maldives: Reethi Beach Resort — 4 stars
- Istanbul: Sultania Hotel — 4 stars
- Makkah: voco Makkah — 4 stars
- Sharm El Sheikh: JAZ Fayrouz — 4 stars

## Important technical note
The ZIP does not redistribute third-party photo files. The website uses the real source URLs directly. The admin panel includes multi-image upload to Firebase Storage, so the administrator can upload photos that FLORIN has permission to use and replace the remote URLs.

## Admin control
The Offers section controls every Firestore offer. The administrator can:
- Add an offer
- Edit any offer
- Delete any offer
- Show/hide an offer
- Change the hotel and star rating
- Change room types and amenities
- Change the main photo and gallery URLs
- Upload multiple photos from a phone to Firebase Storage
- Seed/sync the five starter hotel packages into Firestore

Before commercial publication, confirm photo licensing/permission with the hotel or image provider.
