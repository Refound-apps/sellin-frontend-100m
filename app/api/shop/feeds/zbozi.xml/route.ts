import { NextRequest } from 'next/server';
import { handleShopFeedRequest } from '@/lib/shop/feed-route';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleShopFeedRequest(request, 'zbozi');
}
