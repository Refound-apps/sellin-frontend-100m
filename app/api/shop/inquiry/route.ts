import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

type ReservationInsert = Database['public']['Tables']['shop_reservations']['Insert'];

/** Prefer service role for public storefront writes (bypasses RLS RETURNING issues). */
function createReservationWriter() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    return createServiceClient<Database>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return null;
}

/** Always CC this address while testing shop inquiry delivery. */
const TEST_INQUIRY_EMAIL = 'duc4n@seznam.cz';

type InquiryType = 'dimension' | 'contact' | 'reservation';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function uniqueEmails(emails: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of emails) {
    const email = (raw || '').trim().toLowerCase();
    if (!email || !isValidEmail(email) || seen.has(email)) continue;
    seen.add(email);
    result.push(email);
  }
  return result;
}

function buildSubject(type: InquiryType, shopName: string, offerTitle?: string | null): string {
  switch (type) {
    case 'reservation':
      return `Prodejomat – Rezervace: ${offerTitle || 'nabídka'} (${shopName})`;
    case 'dimension':
      return `Prodejomat – Poptávka rozměru (${shopName})`;
    case 'contact':
    default:
      return `Prodejomat – Zpráva z e-shopu (${shopName})`;
  }
}

function buildText(params: {
  type: InquiryType;
  shopName: string;
  shopDomain?: string | null;
  name?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  message?: string | null;
  size?: string | null;
  offerTitle?: string | null;
  offerId?: string | null;
  offerPrice?: string | number | null;
  pickup?: string | null;
}): string {
  const lines: string[] = [
    `Nová poptávka z e-shopu ${params.shopName}`,
  ];

  if (params.shopDomain) {
    lines.push(`E-shop: ${params.shopDomain}`);
  }

  lines.push('');

  if (params.type === 'reservation') {
    lines.push('Typ: Rezervace nabídky');
    if (params.offerTitle) lines.push(`Nabídka: ${params.offerTitle}`);
    if (params.offerId) lines.push(`ID nabídky: ${params.offerId}`);
    if (params.offerPrice != null && params.offerPrice !== '') {
      lines.push(`Cena: ${params.offerPrice} Kč`);
    }
    if (params.pickup) {
      lines.push(
        `Způsob předání: ${params.pickup === 'posta' ? 'Zaslání poštou' : 'Osobní odběr'}`
      );
    }
  } else if (params.type === 'dimension') {
    lines.push('Typ: Poptávka rozměru');
    if (params.size) lines.push(`Požadovaný rozměr / auto: ${params.size}`);
  } else {
    lines.push('Typ: Kontaktní zpráva');
  }

  lines.push('');
  if (params.name) lines.push(`Jméno: ${params.name}`);
  if (params.phone) lines.push(`Telefon: ${params.phone}`);
  if (params.email) lines.push(`E-mail: ${params.email}`);
  if (params.address) lines.push(`Adresa: ${params.address}`);
  if (params.contact) lines.push(`Kontakt: ${params.contact}`);
  if (params.message) {
    lines.push('');
    lines.push('Zpráva:');
    lines.push(params.message);
  }

  lines.push('');
  lines.push('---');
  lines.push('Odesláno automaticky z Prodejomatu.');

  return lines.join('\n');
}

function buildHtml(params: {
  type: InquiryType;
  shopName: string;
  shopDomain?: string | null;
  name?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  message?: string | null;
  size?: string | null;
  offerTitle?: string | null;
  offerId?: string | null;
  offerPrice?: string | number | null;
  pickup?: string | null;
}): string {
  const rows: Array<[string, string]> = [];

  if (params.type === 'reservation') {
    rows.push(['Typ', 'Rezervace nabídky']);
    if (params.offerTitle) rows.push(['Nabídka', params.offerTitle]);
    if (params.offerId) rows.push(['ID nabídky', params.offerId]);
    if (params.offerPrice != null && params.offerPrice !== '') {
      rows.push(['Cena', `${params.offerPrice} Kč`]);
    }
    if (params.pickup) {
      rows.push([
        'Způsob předání',
        params.pickup === 'posta' ? 'Zaslání poštou' : 'Osobní odběr',
      ]);
    }
  } else if (params.type === 'dimension') {
    rows.push(['Typ', 'Poptávka rozměru']);
    if (params.size) rows.push(['Požadovaný rozměr / auto', params.size]);
  } else {
    rows.push(['Typ', 'Kontaktní zpráva']);
  }

  if (params.name) rows.push(['Jméno', params.name]);
  if (params.phone) rows.push(['Telefon', params.phone]);
  if (params.email) rows.push(['E-mail', params.email]);
  if (params.address) rows.push(['Adresa', params.address]);
  if (params.contact) rows.push(['Kontakt', params.contact]);
  if (params.message) rows.push(['Zpráva', params.message]);

  const tableRows = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 12px;color:#64748b;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;color:#0f172a;font-size:14px;white-space:pre-wrap;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join('');

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#0f172a;color:#ffffff;padding:18px 20px;">
      <div style="font-size:12px;opacity:0.7;letter-spacing:0.04em;text-transform:uppercase;">Prodejomat</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px;">Nová poptávka z e-shopu</div>
      <div style="font-size:14px;margin-top:6px;opacity:0.9;">${escapeHtml(params.shopName)}${params.shopDomain ? ` · ${escapeHtml(params.shopDomain)}` : ''}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 4px;">${tableRows}</table>
    <div style="padding:12px 20px 18px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;">
      Odesláno automaticky z Prodejomatu.
    </div>
  </div>`;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Chybí RESEND_API_KEY – e-mail nelze odeslat.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const type = (String(body?.type || 'contact').trim().toLowerCase() || 'contact') as InquiryType;
    if (!['dimension', 'contact', 'reservation'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Neplatný typ poptávky.' }, { status: 400 });
    }

    const name = String(body?.name || '').trim().slice(0, 120);
    const contact = String(body?.contact || '').trim().slice(0, 200);
    const email = String(body?.email || '').trim().slice(0, 200).toLowerCase();
    const phone = String(body?.phone || '').trim().slice(0, 40);
    const address = String(body?.address || '').trim().slice(0, 300);
    const message = String(body?.message || body?.note || '').trim().slice(0, 2000);
    const size = String(body?.size || body?.dimension || '').trim().slice(0, 300);
    const offerTitle = String(body?.offer_title || body?.offerTitle || '').trim().slice(0, 300);
    const offerId = String(body?.offer_id || body?.offerId || '').trim().slice(0, 80);
    const offerPrice = body?.offer_price ?? body?.offerPrice ?? null;
    const pickup = String(body?.pickup || '').trim().slice(0, 40);
    const shopId = String(body?.shop_id || body?.shopId || '').trim();
    const shopSlugOrDomain = String(body?.shop || body?.domain || body?.slug || '').trim().toLowerCase();

    if (type === 'dimension') {
      if (!size || (!phone && !email && !contact)) {
        return NextResponse.json(
          { success: false, error: 'Vyplňte rozměr a alespoň telefon nebo e-mail.' },
          { status: 400 }
        );
      }
      if (email && !isValidEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Zadejte platný e-mail.' },
          { status: 400 }
        );
      }
    }
    if (type === 'contact') {
      if (!name || (!phone && !email && !contact)) {
        return NextResponse.json(
          { success: false, error: 'Vyplňte jméno a alespoň telefon nebo e-mail.' },
          { status: 400 }
        );
      }
      if (email && !isValidEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Zadejte platný e-mail.' },
          { status: 400 }
        );
      }
    }
    if (type === 'reservation') {
      if (!phone || !email || !address) {
        return NextResponse.json(
          { success: false, error: 'Vyplňte e-mail, telefon a adresu.' },
          { status: 400 }
        );
      }
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Zadejte platný e-mail.' },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();
    let shop: {
      id: string;
      shop_name: string;
      email: string | null;
      owner_email: string;
      custom_domain: string | null;
      slug: string;
    } | null = null;

    if (shopId) {
      const { data } = await supabase
        .from('shops')
        .select('id, shop_name, email, owner_email, custom_domain, slug')
        .eq('id', shopId)
        .eq('is_active', true)
        .limit(1);
      shop = data?.[0] || null;
    }

    if (!shop && shopSlugOrDomain) {
      const clean = shopSlugOrDomain.replace(/^www\./, '').replace(/:\d+$/, '');
      const { data } = await supabase
        .from('shops')
        .select('id, shop_name, email, owner_email, custom_domain, slug')
        .or(
          `custom_domain.ilike.${clean},custom_domain.ilike.www.${clean},slug.ilike.${clean.split('.')[0]}`
        )
        .eq('is_active', true)
        .limit(1);
      shop = data?.[0] || null;
    }

    if (!shop) {
      const headerDomain = (
        request.headers.get('x-shop-domain') ||
        request.headers.get('host') ||
        ''
      )
        .toLowerCase()
        .trim()
        .replace(/^www\./, '')
        .replace(/:\d+$/, '');

      if (
        headerDomain &&
        !headerDomain.includes('localhost') &&
        !headerDomain.includes('vercel.app') &&
        !headerDomain.includes('prodejomat.cz') &&
        !headerDomain.includes('sellin.cz')
      ) {
        const { data } = await supabase
          .from('shops')
          .select('id, shop_name, email, owner_email, custom_domain, slug')
          .or(`custom_domain.ilike.${headerDomain},custom_domain.ilike.www.${headerDomain}`)
          .eq('is_active', true)
          .limit(1);
        shop = data?.[0] || null;
      }
    }

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'E-shop nebyl nalezen.' },
        { status: 404 }
      );
    }

    const ownerRecipient = (shop.email || shop.owner_email || '').trim().toLowerCase();
    const toRecipients = uniqueEmails([ownerRecipient]);
    const bccRecipients = uniqueEmails([TEST_INQUIRY_EMAIL]).filter(
      (email) => !toRecipients.includes(email)
    );

    if (toRecipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'E-shop nemá nastavený e-mail pro příjem poptávek.' },
        { status: 400 }
      );
    }

    const shopDomain =
      shop.custom_domain ||
      (shop.slug ? `${shop.slug}.prodejomat.cz` : null);

    const payload = {
      type,
      shopName: shop.shop_name,
      shopDomain,
      name: name || null,
      contact: contact || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      message: message || null,
      size: size || null,
      offerTitle: offerTitle || null,
      offerId: offerId || null,
      offerPrice,
      pickup: pickup || null,
    };

    const customerReplyTo =
      (email && isValidEmail(email) ? email : null) ||
      (contact && isValidEmail(contact) ? contact : null) ||
      (phone && isValidEmail(phone) ? phone : null) ||
      undefined;

    let reservationId: string | null = null;
    if (type === 'reservation') {
      const parsedPrice =
        offerPrice == null || offerPrice === ''
          ? null
          : Number.isFinite(Number(offerPrice))
            ? Number(offerPrice)
            : null;
      const normalizedPickup =
        pickup === 'posta' || pickup === 'osobni' ? pickup : null;

      reservationId = crypto.randomUUID();
      const reservationRow: ReservationInsert = {
        id: reservationId,
        shop_id: shop.id,
        offer_id: offerId || null,
        offer_title: offerTitle || null,
        offer_price: parsedPrice,
        customer_name: name || null,
        customer_email: email || null,
        customer_phone: phone,
        customer_address: address || null,
        pickup: normalizedPickup,
        note: message || null,
        status: 'new',
      };

      // Avoid .select() after insert — anon/authenticated cannot read rows (owner-only SELECT RLS).
      const writer = createReservationWriter() || supabase;
      const { error: reservationError } = await writer
        .from('shop_reservations')
        .insert(reservationRow);

      if (reservationError) {
        console.error('Shop reservation save failed:', reservationError);
        reservationId = null;
        return NextResponse.json(
          { success: false, error: 'Rezervaci se nepodařilo uložit. Zkuste to znovu.' },
          { status: 500 }
        );
      }
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'Prodejomat <robot@prodejomat.cz>',
      to: toRecipients,
      ...(bccRecipients.length > 0 ? { bcc: bccRecipients } : {}),
      replyTo: customerReplyTo,
      subject: buildSubject(type, shop.shop_name, offerTitle),
      text: buildText(payload),
      html: buildHtml(payload),
    });

    if (error) {
      console.error('Shop inquiry email failed:', error);
      // Reservation is already persisted — still report success for the customer flow
      if (type === 'reservation' && reservationId) {
        return NextResponse.json({
          success: true,
          id: reservationId,
          email_error: error.message || 'E-mail se nepodařilo odeslat.',
        });
      }
      return NextResponse.json(
        { success: false, error: error.message || 'Odeslání e-mailu selhalo.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: reservationId || data?.id || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Neočekávaná chyba';
    console.error('POST /api/shop/inquiry error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
