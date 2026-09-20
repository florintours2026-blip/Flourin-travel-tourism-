"""
FLORIN Travel Supplier API
==========================

Backend for the FLORIN static/Firebase website.

Hotel sources:
- Booking.com Demand API (when partner credentials are configured)
- Agoda Demand API (when partner credentials are configured)
- Trip.com partner API (adapter hook; credentials/schema depend on the approved Trip.com program)

Flight sources:
- Direct airline/NDC adapters can be configured per airline.
- The airline logo in Firestore/catalog-data.js identifies the carrier only;
  it is NOT an API credential and cannot provide live prices by itself.

DeepSeek:
- Used to normalize/enrich supplier data.
- Never used as the source of a live ticket/hotel price.

Firestore:
- Hotels and flights are saved into the existing `offers` collection so the
  current FLORIN frontend can display them without changing its data model.

Install:
    pip install -r requirements-florin-api.txt

Environment:
    copy .env.florin.example to .env

Run:
    uvicorn florin_travel_api:app --host 0.0.0.0 --port 8000

Production:
- Put this API behind HTTPS.
- Keep supplier/API credentials server-side.
- The browser should send a Firebase ID token in:
      Authorization: Bearer <firebase-id-token>
"""

from __future__ import annotations

import json
import os
import re
import uuid
from datetime import date, datetime, timezone
from typing import Any, Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field
import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, firestore


load_dotenv()

APP_NAME = "FLORIN Travel Supplier API"
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-flash")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

BOOKING_API_KEY = os.getenv("BOOKING_API_KEY", "")
BOOKING_AFFILIATE_ID = os.getenv("BOOKING_AFFILIATE_ID", "")
BOOKING_BASE_URL = os.getenv(
    "BOOKING_BASE_URL", "https://demandapi.booking.com/3.2"
)

AGODA_BASE_URL = os.getenv("AGODA_BASE_URL", "")
AGODA_SITE_ID = os.getenv("AGODA_SITE_ID", "")
AGODA_API_KEY = os.getenv("AGODA_API_KEY", "")

TRIP_BASE_URL = os.getenv("TRIP_BASE_URL", "")
TRIP_API_KEY = os.getenv("TRIP_API_KEY", "")

FLORIN_ALLOWED_ORIGINS = [
    x.strip()
    for x in os.getenv(
        "FLORIN_ALLOWED_ORIGINS",
        "http://localhost:5500,http://127.0.0.1:5500",
    ).split(",")
    if x.strip()
]

CUSTOMER_MARKUP = float(os.getenv("CUSTOMER_MARKUP", "20"))
AGENT_MARKUP = float(os.getenv("AGENT_MARKUP", "10"))
FRIDAY_DISCOUNT = float(os.getenv("FRIDAY_DISCOUNT", "5"))

# Optional direct airline/NDC configuration.
# Example:
# AIRLINE_API_CONFIG='{"egyptair":{"base_url":"https://...","type":"ndc"},
#                      "qatar":{"base_url":"https://...","type":"ndc"}}'
try:
    AIRLINE_API_CONFIG = json.loads(os.getenv("AIRLINE_API_CONFIG", "{}"))
except json.JSONDecodeError:
    AIRLINE_API_CONFIG = {}

app = FastAPI(title=APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FLORIN_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Firebase
# ---------------------------------------------------------------------------

def init_firebase() -> None:
    if firebase_admin._apps:
        return

    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    service_account_file = os.getenv("FIREBASE_SERVICE_ACCOUNT_FILE", "").strip()

    if service_account_json:
        info = json.loads(service_account_json)
        firebase_admin.initialize_app(credentials.Certificate(info))
        return

    if service_account_file:
        firebase_admin.initialize_app(
            credentials.Certificate(service_account_file)
        )
        return

    # GOOGLE_APPLICATION_CREDENTIALS can be used by firebase-admin.
    firebase_admin.initialize_app()


try:
    init_firebase()
    FIRESTORE = firestore.client()
except Exception as exc:
    FIRESTORE = None
    FIREBASE_INIT_ERROR = str(exc)


def require_user(
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Firebase ID token مطلوب.")

    token = authorization.split(" ", 1)[1].strip()

    try:
        return firebase_auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=401,
            detail=f"Firebase ID token غير صالح: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class HotelUrlImportRequest(BaseModel):
    url: str = Field(min_length=10)
    role: str = "customer"


class HotelSearchRequest(BaseModel):
    provider: str
    city_id: Optional[int] = None
    accommodation_id: Optional[int] = None
    country: str = "eg"
    checkin: date
    checkout: date
    adults: int = Field(default=2, ge=1, le=20)
    rooms: int = Field(default=1, ge=1, le=10)
    currency: str = "USD"
    maximum_results: int = Field(default=20, ge=1, le=100)


class FlightSearchRequest(BaseModel):
    airline_id: Optional[str] = None
    from_iata: str = Field(min_length=3, max_length=3)
    to_iata: str = Field(min_length=3, max_length=3)
    departure_date: date
    return_date: Optional[date] = None
    adults: int = Field(default=1, ge=1, le=9)
    cabin: str = "ECONOMY"
    currency: str = "USD"


class SaveOfferRequest(BaseModel):
    offer: dict[str, Any]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def source_from_url(url: str) -> str:
    host = urlparse(url).hostname or ""
    host = host.lower()

    if "booking." in host:
        return "booking"
    if "trip.com" in host:
        return "trip"
    if "agoda." in host:
        return "agoda"
    return "unknown"


def money_number(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)

    text = re.sub(r"[^\d.,-]", "", str(value))

    if "," in text and "." in text:
        if text.rfind(",") > text.rfind("."):
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif "," in text:
        text = text.replace(",", "")

    try:
        return float(text)
    except ValueError:
        return None


def selling_price(
    supplier_price: float,
    role: str = "customer",
    friday_discount: bool = False,
) -> float:
    markup = AGENT_MARKUP if role.lower() == "agent" else CUSTOMER_MARKUP
    price = supplier_price * (1 + markup / 100)

    if friday_discount and datetime.now().weekday() == 4:
        price *= 1 - FRIDAY_DISCOUNT / 100

    return round(price, 2)


def deepseek_normalize(payload: dict[str, Any]) -> dict[str, Any]:
    if not DEEPSEEK_API_KEY:
        return payload

    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL,
    )

    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "أنت نظام FLORIN لتوحيد بيانات السفر. "
                    "أعد JSON فقط. لا تخترع سعرًا أو توفرًا. "
                    "حافظ على source وsource_url وsupplier_price كما هي."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(payload, ensure_ascii=False),
            },
        ],
        max_tokens=5000,
    )

    content = response.choices[0].message.content
    if not content:
        return payload

    try:
        result = json.loads(content)
        return {**payload, **result}
    except json.JSONDecodeError:
        return payload


# ---------------------------------------------------------------------------
# Public URL metadata importer
# ---------------------------------------------------------------------------

async def fetch_public_metadata(url: str) -> dict[str, Any]:
    """
    Metadata-only URL import.

    This is intentionally not a CAPTCHA bypass or authenticated scraper.
    For live rates, use the approved provider APIs below.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 Chrome/140.0 Safari/537.36"
        ),
        "Accept-Language": "ar,en;q=0.8",
    }

    async with httpx.AsyncClient(
        timeout=25,
        follow_redirects=True,
        headers=headers,
    ) as client:
        response = await client.get(url)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    def meta(prop: str, attr: str = "property") -> str:
        tag = soup.find("meta", attrs={attr: prop})
        return str(tag.get("content", "")).strip() if tag else ""

    title = meta("og:title") or (
        soup.title.get_text(" ", strip=True) if soup.title else ""
    )
    description = meta("og:description") or meta("description", "name")

    images = []
    for tag in soup.find_all("meta", property="og:image"):
        value = tag.get("content")
        if value:
            images.append(value)

    return {
        "source": source_from_url(url),
        "source_url": str(response.url),
        "title": title[:300],
        "description": description[:2000],
        "images": list(dict.fromkeys(images))[:20],
    }


@app.post("/api/hotels/import-url")
async def import_hotel_url(
    request: HotelUrlImportRequest,
    user: dict[str, Any] = Depends(require_user),
):
    source = source_from_url(request.url)

    if source not in {"booking", "trip", "agoda"}:
        raise HTTPException(
            status_code=400,
            detail="الرابط يجب أن يكون Booking.com أو Trip.com أو Agoda.",
        )

    metadata = await fetch_public_metadata(request.url)

    normalized = deepseek_normalize(
        {
            **metadata,
            "type": "hotel",
            "category": "فنادق",
            "supplier": source,
        }
    )

    result = {
        "type": "hotel",
        "category": "فنادق",
        "name": normalized.get("title", ""),
        "description": normalized.get("description", ""),
        "image": (normalized.get("images") or [""])[0],
        "images": normalized.get("images") or [],
        "supplier": source,
        "sourceUrl": normalized.get("source_url", request.url),
        "importedBy": user.get("uid", ""),
        "importedAt": datetime.now(timezone.utc).isoformat(),
        "active": True,
    }

    # URL import may not contain a reliable live price.
    # Do NOT invent one.
    if normalized.get("supplier_price") is not None:
        supplier_price = money_number(normalized["supplier_price"])
        if supplier_price is not None:
            result["supplierPrice"] = supplier_price
            result["price"] = selling_price(
                supplier_price,
                request.role,
            )
            result["currency"] = normalized.get("currency", "USD")

    return {
        "success": True,
        "livePrice": "price" in result,
        "offer": result,
    }


# ---------------------------------------------------------------------------
# Booking.com Demand API
# ---------------------------------------------------------------------------

async def booking_search(request: HotelSearchRequest) -> dict[str, Any]:
    if not BOOKING_API_KEY or not BOOKING_AFFILIATE_ID:
        return {
            "provider": "booking",
            "configured": False,
            "message": (
                "Booking Demand API credentials are not configured. "
                "Register as a Managed Affiliate Partner and set "
                "BOOKING_API_KEY + BOOKING_AFFILIATE_ID."
            ),
            "results": [],
        }

    payload: dict[str, Any] = {
        "checkin": request.checkin.isoformat(),
        "checkout": request.checkout.isoformat(),
        "booker": {
            "country": request.country.lower(),
            "platform": "desktop",
        },
        "guests": {
            "number_of_rooms": request.rooms,
            "number_of_adults": request.adults,
        },
        "currency": request.currency.upper(),
        "maximum_results": request.maximum_results,
    }

    if request.city_id is not None:
        payload["city"] = request.city_id

    if request.accommodation_id is not None:
        payload["accommodations"] = [request.accommodation_id]

    headers = {
        "Authorization": f"Bearer {BOOKING_API_KEY}",
        "X-Affiliate-Id": BOOKING_AFFILIATE_ID,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{BOOKING_BASE_URL}/accommodations/search",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        return response.json()


# ---------------------------------------------------------------------------
# Agoda adapter
# ---------------------------------------------------------------------------

async def agoda_search(request: HotelSearchRequest) -> dict[str, Any]:
    if not AGODA_BASE_URL or not AGODA_SITE_ID or not AGODA_API_KEY:
        return {
            "provider": "agoda",
            "configured": False,
            "message": (
                "Agoda credentials/endpoints are not configured. "
                "Agoda provides partner credentials and API endpoints "
                "after partnership/onboarding."
            ),
            "results": [],
        }

    # Agoda endpoint and request fields vary by approved partnership model.
    # Keep the endpoint configurable rather than guessing a private endpoint.
    payload = {
        "site_id": AGODA_SITE_ID,
        "checkin": request.checkin.isoformat(),
        "checkout": request.checkout.isoformat(),
        "adults": request.adults,
        "rooms": request.rooms,
        "currency": request.currency.upper(),
    }

    headers = {
        "Authorization": f"{AGODA_SITE_ID}:{AGODA_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            AGODA_BASE_URL,
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        return response.json()


# ---------------------------------------------------------------------------
# Trip.com adapter
# ---------------------------------------------------------------------------

async def trip_search(request: HotelSearchRequest) -> dict[str, Any]:
    if not TRIP_BASE_URL or not TRIP_API_KEY:
        return {
            "provider": "trip",
            "configured": False,
            "message": (
                "Trip.com partner API credentials are not configured. "
                "Configure TRIP_BASE_URL and TRIP_API_KEY after your "
                "approved Trip.com integration is enabled."
            ),
            "results": [],
        }

    payload = {
        "checkin": request.checkin.isoformat(),
        "checkout": request.checkout.isoformat(),
        "adults": request.adults,
        "rooms": request.rooms,
        "currency": request.currency.upper(),
    }

    headers = {
        "Authorization": f"Bearer {TRIP_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            TRIP_BASE_URL,
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        return response.json()


@app.post("/api/hotels/search")
async def search_hotels(
    request: HotelSearchRequest,
    user: dict[str, Any] = Depends(require_user),
):
    provider = request.provider.lower()

    if provider == "booking":
        data = await booking_search(request)
    elif provider == "agoda":
        data = await agoda_search(request)
    elif provider == "trip":
        data = await trip_search(request)
    else:
        raise HTTPException(
            status_code=400,
            detail="المصدر يجب أن يكون booking أو trip أو agoda.",
        )

    return {
        "success": True,
        "provider": provider,
        "data": data,
    }


# ---------------------------------------------------------------------------
# Direct airline / NDC search
# ---------------------------------------------------------------------------

async def direct_airline_search(
    airline_id: str,
    request: FlightSearchRequest,
) -> dict[str, Any]:
    config = AIRLINE_API_CONFIG.get(airline_id)

    if not config:
        return {
            "airlineId": airline_id,
            "configured": False,
            "message": (
                "لا يوجد API/NDC مصرح به لهذه الشركة في الإعدادات. "
                "اللوجو وحده لا يوفر أسعارًا حية."
            ),
            "results": [],
        }

    base_url = config.get("base_url")
    if not base_url:
        return {
            "airlineId": airline_id,
            "configured": False,
            "results": [],
        }

    payload = {
        "origin": request.from_iata.upper(),
        "destination": request.to_iata.upper(),
        "departureDate": request.departure_date.isoformat(),
        "returnDate": (
            request.return_date.isoformat()
            if request.return_date
            else None
        ),
        "adults": request.adults,
        "cabin": request.cabin.upper(),
        "currency": request.currency.upper(),
    }

    headers = {
        "Content-Type": "application/json",
    }

    # Provider-specific auth stays on the server.
    if config.get("api_key"):
        headers["Authorization"] = f"Bearer {config['api_key']}"

    async with httpx.AsyncClient(timeout=35) as client:
        response = await client.post(
            base_url,
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        return response.json()


@app.post("/api/flights/search")
async def search_flights(
    request: FlightSearchRequest,
    user: dict[str, Any] = Depends(require_user),
):
    airline_ids = (
        [request.airline_id]
        if request.airline_id
        else list(AIRLINE_API_CONFIG.keys())
    )

    results = []

    for airline_id in airline_ids:
        try:
            data = await direct_airline_search(airline_id, request)
            results.append(data)
        except Exception as exc:
            results.append(
                {
                    "airlineId": airline_id,
                    "configured": True,
                    "error": str(exc),
                    "results": [],
                }
            )

    return {
        "success": True,
        "from": request.from_iata.upper(),
        "to": request.to_iata.upper(),
        "departureDate": request.departure_date.isoformat(),
        "results": results,
    }


# ---------------------------------------------------------------------------
# Save into the existing FLORIN Firestore "offers" collection
# ---------------------------------------------------------------------------

def require_firestore() -> Any:
    if FIRESTORE is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "Firebase Admin غير مهيأ. "
                "اضبط FIREBASE_SERVICE_ACCOUNT_FILE أو "
                "FIREBASE_SERVICE_ACCOUNT_JSON."
            ),
        )
    return FIRESTORE


@app.post("/api/offers/save")
async def save_offer(
    request: SaveOfferRequest,
    user: dict[str, Any] = Depends(require_user),
):
    fs = require_firestore()

    offer = dict(request.offer)

    if not offer.get("name"):
        raise HTTPException(status_code=400, detail="اسم العرض مطلوب.")

    offer_id = str(offer.get("id") or f"imported_{uuid.uuid4().hex[:12]}")
    offer["id"] = offer_id
    offer["active"] = offer.get("active", True)
    offer["updatedBy"] = user.get("uid", "")
    offer["updatedAt"] = firestore.SERVER_TIMESTAMP

    fs.collection("offers").document(offer_id).set(offer, merge=True)

    return {
        "success": True,
        "collection": "offers",
        "id": offer_id,
        "offer": offer,
    }


@app.get("/health")
async def health():
    return {
        "ok": True,
        "service": APP_NAME,
        "firebase": FIRESTORE is not None,
        "bookingConfigured": bool(
            BOOKING_API_KEY and BOOKING_AFFILIATE_ID
        ),
        "agodaConfigured": bool(
            AGODA_BASE_URL and AGODA_SITE_ID and AGODA_API_KEY
        ),
        "tripConfigured": bool(TRIP_BASE_URL and TRIP_API_KEY),
        "airlineProvidersConfigured": list(AIRLINE_API_CONFIG.keys()),
    }
