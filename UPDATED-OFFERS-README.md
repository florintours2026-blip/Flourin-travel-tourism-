# FLORIN — Updated Offers Package

This package fixes the offers/visa deployment issues and prepares the active assets for GitHub Pages.

## Offers
- 8 starter offers are defined in `assets/js/offers-data.js` and `assets/data/offers.json`.
- Firestore offers are merged with the local starter catalog, so old Firestore records no longer hide newly added starter offers.
- The five hotel packages use multi-image hotel galleries from `assets/data/hotel-galleries.json`.
- `offer-details.html` displays the hotel/gallery images, room options, amenities, source gallery and booking button.
- The active offer artwork is under `assets/images/offers/cleaned/` and the previous duplicate offer artwork has been removed from the active package.

## Visas
- `assets/data/visas.json` contains 18 visa/service entries.
- Every entry has a local flag and a booking target under `booking.html`.
- The visa pages now show a clear error if the JSON cannot be fetched instead of remaining on a loading message.

## Admin
- Fixed the JavaScript syntax problem that prevented `admin.js` from executing.
- The admin permission check has an explicit timeout.
- Required Firestore document: `admins/{USER_UID}` with `active: true`.
- The "مزامنة البكجات المبدئية" button can be used after admin access is verified to write the starter offers to Firestore.

## Images
The active offer cover files have been trimmed to remove the printed FLORIN branding header from the artwork. Hotel gallery photos are referenced from official hotel/brand gallery assets; verify commercial image-use rights before production use.
