/* =========================================================
   FLORIN — URL Scraper
   Extracts hotel data from Booking.com, Trip.com, TravelGo
   Uses multiple CORS proxies for reliability
   ========================================================= */

const PROXIES = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`
];

const HOSTS = {
  booking: ['booking.com', 'www.booking.com'],
  trip:    ['trip.com', 'www.trip.com', 'uk.trip.com', 'ar.trip.com'],
  travelgo:['travelgo.com', 'travelocity.com', 'www.travelgo.com']
};

/* ============ Helpers ============ */

function detectSource(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('booking')) return 'booking';
    if (host.includes('trip.com')) return 'trip';
    if (host.includes('travelgo') || host.includes('travelocity')) return 'travelgo';
    return 'unknown';
  } catch {
    return 'invalid';
  }
}

async function tryFetchViaProxies(targetUrl) {
  const errors = [];
  for (const proxyFn of PROXIES) {
    try {
      const proxyUrl = proxyFn(targetUrl);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        errors.push(`Proxy failed: ${res.status}`);
        continue;
      }
      const text = await res.text();
      let html = text;
      try {
        const parsed = JSON.parse(text);
        html = parsed.contents || parsed.body || parsed;
      } catch {}
      if (html && html.length > 5000) {
        return { html, error: null };
      }
      errors.push('Empty response');
    } catch (e) {
      errors.push(e.message);
      continue;
    }
  }
  return { html: null, error: errors.join(' | ') };
}

/* ============ Extractors ============ */

function extractImages(html, source) {
  const images = new Set();

  // 1. Open Graph image
  const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
  if (ogMatch) images.add(ogMatch[1]);

  // 2. Look for high-quality image URLs (Booking uses cf.bstatic.com)
  const patterns = [
    /https:\/\/cf\.bstatic\.com\/xdata\/images\/hotel\/[^"'\s\\]+\.jpg/gi,
    /https:\/\/cf\.bstatic\.com\/xdata\/images\/[^"'\s\\]+\.jpg/gi,
    /https:\/\/ak-d\.tripcdn\.com\/[^"'\s\\]+\.jpg/gi,
    /https:\/\/[^"'\s\\]*\.tripcdn\.com\/[^"'\s\\]+\.jpg/gi,
    /https:\/\/media\.travelgo\.com\/[^"'\s\\]+\.jpg/gi,
    /https:\/\/images\.trvl-media\.com\/[^"'\s\\]+\.jpg/gi
  ];

  for (const pattern of patterns) {
    const matches = html.match(pattern) || [];
    matches.forEach(url => {
      const clean = url.replace(/\\/g, '').split('"')[0];
      if (!clean.includes('logo') && !clean.includes('icon') && !clean.includes('avatar')) {
        images.add(clean);
      }
    });
    if (images.size >= 15) break;
  }

  // 3. Fallback: any large jpg in html
  if (images.size < 5) {
    const genericMatches = html.match(/https:\/\/[^"'\s\\]{30,}\.(jpg|jpeg|webp)/gi) || [];
    genericMatches.forEach(url => {
      const clean = url.replace(/\\/g, '').split('"')[0];
      if (!clean.includes('logo') && !clean.includes('icon') && !clean.includes('avatar')) {
        images.add(clean);
      }
    });
  }

  return Array.from(images).slice(0, 15);
}

function extractTitle(html) {
  // 1. OG title (most reliable)
  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
  if (ogTitle) return cleanTitle(ogTitle[1]);

  // 2. <title>
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) return cleanTitle(titleMatch[1]);

  // 3. h1
  const h1Match = html.match(/<h1[^>]*>([^<]{5,150})<\/h1>/i);
  if (h1Match) return cleanTitle(h1Match[1]);

  return '';
}

function cleanTitle(title) {
  return title
    .replace(/\s*[\|\-–—]\s*(Booking\.com|Trip\.com|Travelocity|TravelGo).*$/i, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .substring(0, 150);
}

function extractDescription(html) {
  // 1. OG description
  const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
  if (ogDesc) return cleanDescription(ogDesc[1]);

  // 2. Meta description
  const metaDesc = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
  if (metaDesc) return cleanDescription(metaDesc[1]);

  return '';
}

function cleanDescription(desc) {
  return desc
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim()
    .substring(0, 400);
}

function extractStars(html) {
  // Look for star ratings
  const patterns = [
    /"ratingValue"\s*:\s*"?(\d(?:\.\d)?)"?/i,
    /(\d)\s*(?:star|نجوم|estrellas|étoiles)/i,
    /class="[^"]*star[^"]*"[^>]*>.*?(\d)/i
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m && m[1]) {
      const n = Math.round(parseFloat(m[1]));
      if (n >= 1 && n <= 5) return n;
    }
  }
  return null;
}

function extractLocation(html, source) {
  const patterns = [
    /"address"\s*:\s*"([^"]+)"/i,
    /<span[^>]+class="[^"]*address[^"]*"[^>]*>([^<]{10,200})<\/span>/i,
    /"addressLocality"\s*:\s*"([^"]+)"/i
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m && m[1]) {
      return m[1].replace(/\\n/g, ' ').trim().substring(0, 200);
    }
  }
  return '';
}

/* ============ Main Export ============ */

export async function scrapeHotelUrl(url) {
  const source = detectSource(url);

  if (source === 'invalid') {
    return { success: false, error: 'الرابط غير صالح. تأكد من نسخ الرابط كاملًا.' };
  }

  if (source === 'unknown') {
    return { success: false, error: 'الموقع غير مدعوم حاليًا. يدعم النظام: Booking.com، Trip.com، TravelGo/Travelocity' };
  }

  const { html, error } = await tryFetchViaProxies(url);

  if (!html) {
    return {
      success: false,
      error: 'تعذر الوصول للموقع. قد يكون محظورًا مؤقتًا. أدخل البيانات يدويًا.',
      source
    };
  }

  const result = {
    success: true,
    source,
    sourceUrl: url,
    images: extractImages(html, source),
    title: extractTitle(html),
    shortDescription: extractDescription(html),
    stars: extractStars(html),
    location: extractLocation(html, source),
    scrapedAt: new Date().toISOString()
  };

  if (result.images.length === 0 && !result.title) {
    return {
      success: false,
      error: 'لم يتم العثور على بيانات. الموقع قد يكون غيّر تنسيقه. أدخل البيانات يدويًا.',
      source
    };
  }

  return result;
}

export function getSourceLabel(source) {
  const labels = {
    booking: 'Booking.com',
    trip: 'Trip.com',
    travelgo: 'TravelGo',
    unknown: 'موقع غير معروف'
  };
  return labels[source] || source;
}

/* ============ Debug Helper ============ */

export async function testScraper(url) {
  console.log('🧪 Testing scraper for:', url);
  const result = await scrapeHotelUrl(url);
  console.log('📊 Result:', result);
  return result;
}

if (typeof window !== 'undefined') {
  window.FLORIN_SCRAPER = {
    scrape: scrapeHotelUrl,
    test: testScraper,
    getSourceLabel
  };
  console.log('✅ FLORIN URL Scraper loaded');
}
