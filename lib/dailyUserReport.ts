export type DailyReportAccount = {
  email: string;
  telephone1: string | null;
  bazos_name: string | null;
  status_cz: string | null;
  has_bazos_cookie: boolean;
  cookieOk: boolean;
};

export type DailyUserReport = {
  sellerEmail: string;
  generatedAt: string;
  periodLabel: string;
  accounts: DailyReportAccount[];
  totals: {
    accounts: number;
    cookiesOk: number;
    cookiesBad: number;
    bazosOk: number;
    sbazarOk: number;
  };
};

const SUCCESS_CONDITIONS = new Set(['ok_renewed', 'ok_created', 'ok_updated', 'ok_topped']);

function isCookieOk(status: string | null | undefined) {
  return String(status || '').trim().toUpperCase() === 'OK';
}

function cookieLabel(status: string | null | undefined, hasCookie: boolean) {
  if (!hasCookie) return { text: 'Chybí', tone: 'bad' as const };
  if (isCookieOk(status)) return { text: 'OK', tone: 'ok' as const };
  return { text: status || 'Problém', tone: 'bad' as const };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCsDate(d: Date) {
  return d.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toneColor(tone: 'ok' | 'bad' | 'warn') {
  if (tone === 'ok') return { bg: '#ecfdf5', fg: '#065f46', border: '#a7f3d0' };
  if (tone === 'bad') return { bg: '#fff1f2', fg: '#9f1239', border: '#fecdd3' };
  return { bg: '#fffbeb', fg: '#92400e', border: '#fde68a' };
}

type CredRow = {
  email: string;
  telephone1: string | null;
  bazos_name: string | null;
  status_cz: string | null;
  bazos_bkod: string | null;
};

type DetailRow = {
  bb_marketplace_id: string | null;
  condition: string | null;
  last_date_renewed: string | null;
  date?: string | null;
};

export function buildDailyUserReportFromRows(opts: {
  sellerEmail: string;
  credentials: CredRow[];
  details: DetailRow[];
  since: Date;
  until?: Date;
}): DailyUserReport {
  const sellerEmail = opts.sellerEmail.toLowerCase().trim();
  const until = opts.until || new Date();
  const sinceMs = opts.since.getTime();
  const untilMs = until.getTime();

  const accounts: DailyReportAccount[] = opts.credentials.map((cred) => {
    const hasCookie = Boolean(cred.bazos_bkod && String(cred.bazos_bkod).trim());
    return {
      email: cred.email,
      telephone1: cred.telephone1,
      bazos_name: cred.bazos_name,
      status_cz: cred.status_cz,
      has_bazos_cookie: hasCookie,
      cookieOk: hasCookie && isCookieOk(cred.status_cz),
    };
  });

  accounts.sort((a, b) => {
    if (a.email.toLowerCase() === sellerEmail) return -1;
    if (b.email.toLowerCase() === sellerEmail) return 1;
    return a.email.localeCompare(b.email, 'cs');
  });

  let bazosOk = 0;
  let sbazarOk = 0;
  for (const row of opts.details) {
    const condition = String(row.condition || '');
    if (!SUCCESS_CONDITIONS.has(condition)) continue;

    const renewedAtRaw = row.last_date_renewed || row.date || null;
    const renewedAt = renewedAtRaw ? new Date(renewedAtRaw).getTime() : NaN;
    if (!Number.isFinite(renewedAt) || renewedAt < sinceMs || renewedAt > untilMs) continue;

    const marketplace = String(row.bb_marketplace_id || '').toLowerCase();
    if (marketplace.includes('sbazar')) sbazarOk += 1;
    else if (marketplace.includes('bazo')) bazosOk += 1;
  }

  const cookiesOk = accounts.filter((a) => a.cookieOk).length;

  return {
    sellerEmail,
    generatedAt: until.toISOString(),
    periodLabel: `posledních 24 hodin (do ${until.toLocaleString('cs-CZ')})`,
    accounts,
    totals: {
      accounts: accounts.length,
      cookiesOk,
      cookiesBad: accounts.length - cookiesOk,
      bazosOk,
      sbazarOk,
    },
  };
}

export function createDailyUserReportHtml(report: DailyUserReport) {
  const dateTitle = formatCsDate(new Date(report.generatedAt));
  const overallTone: 'ok' | 'bad' =
    report.totals.cookiesBad > 0 ? 'bad' : 'ok';
  const overall = toneColor(overallTone);
  const overallText =
    overallTone === 'ok'
      ? 'Účty vypadají v pořádku'
      : 'Pozor — některé cookie nejsou OK';

  const rows = report.accounts
    .map((account) => {
      const cookie = cookieLabel(account.status_cz, account.has_bazos_cookie);
      const cookieTone = toneColor(cookie.tone);
      const phone = account.telephone1?.trim() || '—';
      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e2e8f0;">
            <div style="font-weight:700;color:#0f172a;font-size:14px;">${escapeHtml(phone)}</div>
            <div style="color:#64748b;font-size:12px;margin-top:2px;">${escapeHtml(account.email)}</div>
          </td>
          <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center;">
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;background:${cookieTone.bg};color:${cookieTone.fg};border:1px solid ${cookieTone.border};">
              ${escapeHtml(cookie.text)}
            </span>
          </td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Prodejomat denní report</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:28px 28px 18px 28px;background:linear-gradient(135deg,#0f172a 0%,#134e4a 100%);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.75;font-weight:700;">Prodejomat · Denní report</div>
              <div style="font-size:24px;font-weight:800;margin-top:8px;line-height:1.2;">${escapeHtml(dateTitle)}</div>
              <div style="margin-top:10px;font-size:14px;opacity:0.9;">
                ${escapeHtml(report.sellerEmail)} · ${report.totals.accounts} účtů
              </div>
              <div style="margin-top:6px;font-size:12px;opacity:0.7;">${escapeHtml(report.periodLabel)}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px 8px 28px;">
              <div style="padding:14px 16px;border-radius:14px;background:${overall.bg};border:1px solid ${overall.border};color:${overall.fg};font-size:14px;font-weight:700;">
                ${overallText}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 28px 8px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="33%" style="padding:6px;">
                    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px 12px;text-align:center;background:#f8fafc;">
                      <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Cookie OK</div>
                      <div style="font-size:22px;font-weight:800;margin-top:6px;">${report.totals.cookiesOk}/${report.totals.accounts}</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:6px;">
                    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px 12px;text-align:center;background:#f8fafc;">
                      <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Bazoš obnovy</div>
                      <div style="font-size:22px;font-weight:800;margin-top:6px;">${report.totals.bazosOk}</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:6px;">
                    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px 12px;text-align:center;background:#f8fafc;">
                      <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Sbazar obnovy</div>
                      <div style="font-size:22px;font-weight:800;margin-top:6px;">${report.totals.sbazarOk}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 28px 28px;">
              <div style="font-size:15px;font-weight:800;margin-bottom:10px;">Zdraví účtů</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
                <tr style="background:#f8fafc;">
                  <th align="left" style="padding:12px;font-size:11px;color:#64748b;text-transform:uppercase;">Účet</th>
                  <th align="center" style="padding:12px;font-size:11px;color:#64748b;text-transform:uppercase;">Cookie</th>
                </tr>
                ${rows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
              Prodejomat denní report ·
              <a href="mailto:obchod@sellin.cz" style="color:#0f766e;font-weight:600;text-decoration:none;">obchod@sellin.cz</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function createDailyUserReportSubject(report: DailyUserReport) {
  const day = new Date(report.generatedAt).toLocaleDateString('cs-CZ');
  const issue = report.totals.cookiesBad > 0 ? '⚠️ ' : '';
  return `${issue}Prodejomat denní report · ${day} · ${report.sellerEmail}`;
}
