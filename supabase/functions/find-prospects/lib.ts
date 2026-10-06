// Pure helpers for find-prospects. No Deno or Supabase imports, so they can be
// tested with plain Node: node --experimental-strip-types lib.test.ts

// ---------------------------------------------------------------------------
// Matching (so known businesses are never added twice)
// ---------------------------------------------------------------------------

/** Last 9 digits: "021 975 1234", "+27 21 975 1234" and "0219751234" all match. */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : null;
}

/** "https://www.Example.co.za/contact" -> "example.co.za". */
export function websiteKey(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.toLowerCase();
    return host.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Pitch
// ---------------------------------------------------------------------------

export type Offer = 'website' | 'whatsapp_automation' | 'voice_agent' | 'other';

const PHONE_DRIVEN_INDUSTRIES = new Set(['dental', 'medical', 'legal']);
const PHONE_DRIVEN_CATEGORY = /vet|physio|doctor|dent|attorney|lawyer/i;

export interface PitchInput {
  website: string | null;
  website_checked_at: string | null;
  /** null = not checked yet, or the site didn't load. */
  has_whatsapp: boolean | null;
  has_booking: boolean | null;
  review_count: number | null;
  rating: number | null;
  industry: string;
  category: string | null;
  phone: string | null;
}

export interface Pitch {
  suggested_offer: Offer;
  pitch_reason: string;
  /** Priority 0-100: how strong the pitch is, how busy they are, and whether we can call them. */
  score: number;
}

export function suggestPitch(p: PitchInput): Pitch {
  const reviews = p.review_count ?? 0;
  const phoneDriven = PHONE_DRIVEN_INDUSTRIES.has(p.industry) || PHONE_DRIVEN_CATEGORY.test(p.category ?? '');
  let offer: Offer;
  let reason: string;

  if (!p.website) {
    offer = 'website';
    reason = 'No website listed on Google';
  } else if (p.website_checked_at && p.has_whatsapp === null) {
    offer = 'website';
    reason = "Website didn't load when checked - it may be broken or outdated";
  } else if (phoneDriven && reviews >= 50 && !p.has_booking) {
    offer = 'voice_agent';
    reason = `Busy (${reviews} Google reviews) with no online booking - likely missing calls`;
  } else if (!p.website_checked_at) {
    offer = 'whatsapp_automation';
    reason = 'Website not checked yet';
  } else if (!p.has_whatsapp) {
    offer = 'whatsapp_automation';
    reason = p.has_booking
      ? 'Has online booking but no WhatsApp on the website'
      : 'No WhatsApp or online booking on the website';
  } else {
    offer = phoneDriven ? 'voice_agent' : 'other';
    reason = phoneDriven
      ? 'Already on WhatsApp - pitch a voice agent for calls'
      : 'Already on WhatsApp - look for an automation angle';
  }

  const base: Record<Offer, number> = { website: 55, voice_agent: 55, whatsapp_automation: 45, other: 25 };
  let score = base[offer];
  score += Math.min(25, Math.round(Math.log10(reviews + 1) * 10));
  if ((p.rating ?? 0) >= 4) score += 5;
  if (phoneDriven) score += 5;
  score += p.phone ? 10 : -25;
  return { suggested_offer: offer, pitch_reason: reason, score: Math.max(0, Math.min(100, score)) };
}

// ---------------------------------------------------------------------------
// Website content
// ---------------------------------------------------------------------------

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const IGNORED_EMAIL =
  /(\.(png|jpe?g|gif|svg|webp)$)|example\.|sentry|wixpress|domain\.com|yourdomain|@2x|godaddy|wordpress/i;
export const WHATSAPP_PATTERN = /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/|chat\.whatsapp\.com/i;
export const BOOKING_PATTERN =
  /calendly\.com|setmore\.com|fresha\.com|booksy\.com|simplybook|acuityscheduling|bookem|timely\.com|healthbridge|book (an )?appointment|book online|online booking|book now/i;

/** A published contact email, preferring one on the business's own domain. */
export function findEmail(html: string, siteHost: string | null): string | null {
  const candidates = new Set<string>();
  for (const match of html.matchAll(/mailto:([^"'?\s>]+)/gi)) {
    try {
      candidates.add(decodeURIComponent(match[1]).toLowerCase());
    } catch {
      candidates.add(match[1].toLowerCase());
    }
  }
  for (const match of html.matchAll(EMAIL_PATTERN)) candidates.add(match[0].toLowerCase());
  const valid = [...candidates].filter((email) => !IGNORED_EMAIL.test(email) && email.length <= 80 && email.includes('@'));
  return valid.find((email) => siteHost && email.endsWith(`@${siteHost}`)) ?? valid[0] ?? null;
}

/** The site's own contact page link, or /contact as a guess. */
export function findContactUrl(html: string, origin: string): string {
  const match = html.match(/href=["']([^"']*contact[^"']*)["']/i);
  if (match) {
    try {
      const url = new URL(match[1], origin);
      if (url.origin === origin) return url.href;
    } catch {
      // fall through to the default
    }
  }
  return `${origin}/contact`;
}
