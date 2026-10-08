import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';

export const dynamic = 'force-dynamic';

/** Paths that must never go through the catch-all (dedicated routes or admin-only). */
const BLOCKED_PREFIXES = [
  'credentials',
  'jobs',
  'cron',
  'error-screenshots',
  'transactions',
  'offers',
  'admin',
  'coldmail',
  'dailyreport',
  'weeklyreport',
  'test-email',
  'renew',
  'recreate',
  'init',
  'deleteoffer',
  'createofferv2',
  'updateoffer',
  'archive',
  'minifyimages',
  'addvouchers',
  'freeproxies',
  'proxyhealth',
  'bazoscookie',
  'topbazos',
  'mysqltopostgres',
  'importeshop',
  'synceshop',
  'enhanceimages',
  'updatelinks',
  'vouchers-alert',
  'bbofferstopgoffers',
];

/** Narrow allowlist for authenticated proxy fallbacks. */
const ALLOWED_PREFIXES = ['categories', 'shop', 'upload', 'user'];

function isBlocked(subpath: string): boolean {
  const lower = subpath.toLowerCase();
  return BLOCKED_PREFIXES.some(
    (p) => lower === p || lower.startsWith(`${p}/`) || lower.startsWith(p)
  );
}

function isAllowed(subpath: string): boolean {
  const lower = subpath.toLowerCase();
  return ALLOWED_PREFIXES.some((p) => lower === p || lower.startsWith(`${p}/`));
}

async function proxyRequest(request: NextRequest, pathParts: string[]) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Neautorizováno' }, { status: 401 });
    }

    const subpath = pathParts.join('/');
    if (!subpath || isBlocked(subpath) || !isAllowed(subpath)) {
      return NextResponse.json({ success: false, error: 'Endpoint není dostupný' }, { status: 404 });
    }

    const search = request.nextUrl.search;
    const targetPath = `/api/${subpath}${search}`;

    const headers: HeadersInit = {};
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers['content-type'] = contentType;
    }

    const init: RequestInit = {
      method: request.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const body = await request.text();
      if (body) {
        init.body = body;
      }
    }

    const backendRes = await backendFetch(targetPath, init);
    const resContentType = backendRes.headers.get('content-type') || '';

    if (resContentType.includes('application/json')) {
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    }

    const text = await backendRes.text();
    return new NextResponse(text, {
      status: backendRes.status,
      headers: {
        'content-type': resContentType || 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error proxying request to backend:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba při komunikaci s backend serverem.' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}
