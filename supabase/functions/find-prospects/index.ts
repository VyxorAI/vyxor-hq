// Vyxor HQ: find-prospects (Supabase Edge Function, Deno)
//
// Runs daily at 06:00 SAST (pg_cron, see the prospects migration) and on demand
// from the Prospects page. It:
//   1. runs up to SEARCHES_PER_DAY Google Places text searches (oldest first),
//   2. saves new businesses, skipping ones already in prospects, leads or clients,
//   3. checks each new website once for a published email, WhatsApp and online booking,
//   4. suggests what to pitch.
//
// Secrets (Supabase dashboard > Edge Functions > Secrets):
//   GOOGLE_PLACES_API_KEY  required
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
//
// Deploy: npx supabase functions deploy find-prospects --no-verify-jwt --project-ref nfvbnjdnsyrazjdaeaio
// (--no-verify-jwt because this function checks callers itself: a signed-in founder or the cron secret.)

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import {
  BOOKING_PATTERN,
  findContactUrl,
  findEmail,
  phoneKey,
  suggestPitch,
  WHATSAPP_PATTERN,
  websiteKey,
} from './lib.ts';

/** Stays well inside Google's free 1,000 "Text Search Enterprise" requests a month (15 x 31 = 465). */
const SEARCHES_PER_DAY = 15;
/** Websites checked per run; the rest wait for the next run. */
const CRAWL_LIMIT = 60;
const CRAWL_CONCURRENCY = 6;
const FETCH_TIMEOUT_MS = 6_000;
/** Stop starting new work after this long (Edge Function wall-clock limit is 150 s on the free plan). */
const DEADLINE_MS = 110_000;
const MAX_HTML_CHARS = 400_000;

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';
// Enterprise-tier fields (phone, website, rating). Billed per request, not per result.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.businessStatus',
].join(',');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ---------------------------------------------------------------------------
// Google Places
// ---------------------------------------------------------------------------

interface Place {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
}

async function searchPlaces(apiKey: string, textQuery: string): Promise<Place[]> {
  const response = await fetch(PLACES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
    // One page of up to 20 results = one billed request
    body: JSON.stringify({ textQuery, pageSize: 20, regionCode: 'ZA', languageCode: 'en' }),
  });
  if (!response.ok) {
    throw new Error(`Google Places ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const data = (await response.json()) as { places?: Place[] };
  return data.places ?? [];
}

// ---------------------------------------------------------------------------
// Website check: one or two pages per business, once
// ---------------------------------------------------------------------------

async function fetchPage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VyxorHQ-ContactCheck/1.0)', Accept: 'text/html' },
    });
    if (!response.ok || !(response.headers.get('content-type') ?? '').includes('html')) return null;
    return (await response.text()).slice(0, MAX_HTML_CHARS);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface WebsiteCheck {
  email: string | null;
  /** null = the site didn't load */
  has_whatsapp: boolean | null;
  has_booking: boolean | null;
}

async function checkWebsite(website: string): Promise<WebsiteCheck> {
  let origin: string;
  try {
    origin = new URL(website.startsWith('http') ? website : `https://${website}`).origin;
  } catch {
    return { email: null, has_whatsapp: null, has_booking: null };
  }
  const home = await fetchPage(website.startsWith('http') ? website : origin);
  if (!home) return { email: null, has_whatsapp: null, has_booking: null };

  const host = websiteKey(origin);
  let email = findEmail(home, host);
  let pages = home;
  if (!email) {
    const contact = await fetchPage(findContactUrl(home, origin));
    if (contact) {
      email = findEmail(contact, host);
      pages += contact;
    }
  }
  return { email, has_whatsapp: WHATSAPP_PATTERN.test(pages), has_booking: BOOKING_PATTERN.test(pages) };
}

/** Run `work` over items with at most `size` at once, not starting new items after `stopAt`. */
async function inPool<T>(items: T[], size: number, work: (item: T) => Promise<void>, stopAt: number) {
  let next = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length && Date.now() < stopAt) {
      const item = items[next++];
      await work(item);
    }
  });
  await Promise.all(workers);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/** Midnight today in South Africa (UTC+2, no daylight saving), as a UTC timestamp. */
function startOfTodaySast(): string {
  const now = new Date(Date.now() + 2 * 3600_000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 2 * 3600_000).toISOString();
}

/** A scheduled run (cron secret) or a signed-in founder; anyone else is refused. */
async function authorise(req: Request, supabase: SupabaseClient): Promise<'schedule' | 'manual' | null> {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret) {
    const { data } = await supabase.from('app_secrets').select('value').eq('key', 'prospects_cron_secret').maybeSingle();
    return data?.value && data.value === cronSecret ? 'schedule' : null;
  }
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  return !error && data.user ? 'manual' : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const started = Date.now();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const trigger = await authorise(req, supabase);
  if (!trigger) return json({ error: 'Not allowed.' }, 401);

  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) return json({ error: 'GOOGLE_PLACES_API_KEY is not set in the Edge Function secrets.' }, 500);

  try {
    // --- Daily budget (scheduled and manual runs share it) -------------------
    const { count: usedToday } = await supabase
      .from('prospect_searches')
      .select('id', { count: 'exact', head: true })
      .gte('last_run_at', startOfTodaySast());
    const budget = Math.max(0, SEARCHES_PER_DAY - (usedToday ?? 0));

    // --- Known businesses ------------------------------------------------------
    const [{ data: existing }, { data: leads }, { data: clients }] = await Promise.all([
      supabase.from('prospects').select('id, place_id'),
      supabase.from('leads').select('phone, website'),
      supabase.from('clients').select('phone, website'),
    ]);
    const prospectByPlace = new Map((existing ?? []).map((row) => [row.place_id as string, row.id as string]));
    const knownPhones = new Set<string>();
    const knownSites = new Set<string>();
    for (const row of [...(leads ?? []), ...(clients ?? [])]) {
      const phone = phoneKey(row.phone);
      const site = websiteKey(row.website);
      if (phone) knownPhones.add(phone);
      if (site) knownSites.add(site);
    }

    // --- 1. Searches -------------------------------------------------------------
    const { data: searches } =
      budget > 0
        ? await supabase
            .from('prospect_searches')
            .select('*')
            .eq('active', true)
            .order('last_run_at', { ascending: true, nullsFirst: true })
            .limit(budget)
        : { data: [] };

    let searchesRun = 0;
    let added = 0;
    let refreshed = 0;
    const errors: string[] = [];

    for (const search of searches ?? []) {
      if (Date.now() - started > DEADLINE_MS / 2) break; // leave time for website checks
      let places: Place[];
      try {
        places = await searchPlaces(apiKey, `${search.query} in ${search.area}, Cape Town`);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
        break; // likely a key or quota problem; don't burn the rest of the budget
      }
      searchesRun++;
      let found = 0;

      for (const place of places) {
        if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') continue;
        const known = prospectByPlace.get(place.id);
        if (known) {
          await supabase
            .from('prospects')
            .update({
              rating: place.rating ?? null,
              review_count: place.userRatingCount ?? null,
              last_seen_at: new Date().toISOString(),
            })
            .eq('id', known);
          refreshed++;
          continue;
        }
        const phone = place.nationalPhoneNumber ?? null;
        const pKey = phoneKey(phone ?? place.internationalPhoneNumber);
        const sKey = websiteKey(place.websiteUri);
        if ((pKey && knownPhones.has(pKey)) || (sKey && knownSites.has(sKey))) continue; // already a lead or client

        const row = {
          place_id: place.id,
          search_id: search.id,
          business_name: place.displayName?.text ?? 'Unnamed business',
          category: search.category,
          area: search.area,
          industry: search.industry,
          address: place.formattedAddress ?? null,
          phone,
          phone_international: place.internationalPhoneNumber ?? null,
          website: place.websiteUri ?? null,
          rating: place.rating ?? null,
          review_count: place.userRatingCount ?? null,
          maps_url: place.googleMapsUri ?? null,
        };
        const pitch = suggestPitch({ ...row, website_checked_at: null, has_whatsapp: null, has_booking: null });
        const { data: inserted, error } = await supabase.from('prospects').insert({ ...row, ...pitch }).select('id').single();
        if (!error && inserted) {
          prospectByPlace.set(place.id, inserted.id);
          if (pKey) knownPhones.add(pKey);
          if (sKey) knownSites.add(sKey);
          added++;
          found++;
        }
      }

      await supabase
        .from('prospect_searches')
        .update({ last_run_at: new Date().toISOString(), last_result_count: found })
        .eq('id', search.id);
    }

    // --- 2. Website checks ---------------------------------------------------------
    const { data: unchecked } = await supabase
      .from('prospects')
      .select('*')
      .eq('status', 'new')
      .is('website_checked_at', null)
      .not('website', 'is', null)
      .order('created_at', { ascending: true })
      .limit(CRAWL_LIMIT);

    let checked = 0;
    await inPool(
      unchecked ?? [],
      CRAWL_CONCURRENCY,
      async (prospect) => {
        const result = await checkWebsite(prospect.website);
        const now = new Date().toISOString();
        const pitch = suggestPitch({ ...prospect, ...result, website_checked_at: now });
        await supabase
          .from('prospects')
          .update({ ...result, email: result.email ?? prospect.email, website_checked_at: now, ...pitch })
          .eq('id', prospect.id);
        checked++;
      },
      started + DEADLINE_MS,
    );

    return json({
      trigger,
      searchesRun,
      searchesLeftToday: Math.max(0, budget - searchesRun),
      added,
      refreshed,
      websitesChecked: checked,
      errors,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
