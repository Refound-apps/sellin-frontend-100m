export interface Offer {
  id: number;
  title: string;
  description: string;
  price: number;
  preview_image: string;
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
  'auto id': number;
  link: string;
  condition: string;
  autorenew: boolean;
  autorenew_freq: string;
  last_date_renewed: string;
  next_date_renew: string;
  bb_marketplace_id: string;
  date: string;
  bb_offer_id: string;
  bb_email_od?: string;
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
  error?: string;
  limit?: number;
  offset?: number;
}
