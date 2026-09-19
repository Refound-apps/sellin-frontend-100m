export interface Offer {
  id: number;
  title: string;
  description: string;
  price: number;
  preview_image: string;
  image2?: string | null;
  image3?: string | null;
  image4?: string | null;
  image5?: string | null;
  image6?: string | null;
  image7?: string | null;
  image8?: string | null;
  image9?: string | null;
  created_at: string;
  state: string;
  bb_id?: string;
  bb_email?: string;
  seller_phone?: string | null;
  seller_name?: string | null;
  autorenew_freq?: string | null;
}

export interface ShopOffer extends Offer {
  images?: string[];
}

export interface ShopAccount {
  email: string;
  telephone1: string | null;
  bazos_name: string | null;
  sbazar_profile: string | null;
  sbazar_email: string | null;
  location: string | null;
  zipcode: number | string | null;
}

export interface ShopInfo {
  sbazar_email: string;
  accounts: ShopAccount[];
}

export interface OfferDetail {
  id: number;
  'auto id'?: number;
  link: string | null;
  condition: string | null;
  autorenew: boolean | null;
  autorenew_freq: string | null;
  last_date_renewed: string | null;
  next_date_renew: string | null;
  bb_marketplace_id: string | null;
  date: string | null;
  bb_offer_id: string | null;
  bb_email?: string | null;
  bb_email_od?: string | null;
  offer_title?: string | null;
  offer_id?: number | null;
  offer_price?: number | null;
  offer_image?: string | null;
}

export interface TransactionsApiResponse {
  success: boolean;
  data: OfferDetail[];
  total: number;
  limit: number;
  offset: number;
  stats: {
    total: number;
    success: number;
    errors: number;
    autorenewActive: number;
  };
}

export interface User {
  id: number;
  email: string;
  telephone1: string | null;
  telephone2: string | null;
  bazos_email: string | null;
  sbazar_email: string | null;
  facebook_email: string | null;
  bazos_name: string | null;
  location: string | null;
  zipcode: number | string | null;
  zipcode_sk: string | null;
  status_cz: string | null;
  status_sk: string | null;
  sbazar_profile: string | null;
  tier: string | null;
  bazos_rewrite: boolean | null;
  bazos_top_max: number | null;
  bazos_bkod?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  error?: string;
  limit?: number;
  offset?: number;
}
