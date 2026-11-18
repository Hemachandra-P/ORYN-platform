/**
 * Vyna Shared Type Definitions
 * Unified Household Management & Community Marketplace Platform
 */

export type UserRole = 
  | 'user' 
  | 'household_owner' 
  | 'household_admin' 
  | 'platform_admin' 
  | 'super_admin';

export type UserStatus = 'active' | 'suspended' | 'banned';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  subscription_tier: 'free' | 'basic_plus' | 'premium';
}

export interface Household {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  photo_url?: string | null;
  invitation_code: string;
  owner_id: string;
  status: 'active' | 'suspended' | 'archived';
  created_at: string;
  updated_at: string;
  members_count?: number;
}

export type HouseholdMemberRole = 'owner' | 'admin' | 'member';

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: HouseholdMemberRole;
  joined_at: string;
  user?: UserProfile;
}

export type SplitMethod = 'equal' | 'custom' | 'percentage';

export interface ExpenseParticipant {
  user_id: string;
  share_amount_paise: number;
  percentage?: number;
  paid_status: 'unpaid' | 'settled';
  user?: UserProfile;
}

export interface Expense {
  id: string;
  household_id: string;
  title: string;
  description?: string | null;
  total_amount_paise: number; // Stored in paise (integer) to avoid float issues: ₹1200.00 = 120000 paise
  category: 'groceries' | 'rent' | 'utilities' | 'food_dining' | 'household_items' | 'entertainment' | 'other';
  paid_by_id: string;
  paid_by?: UserProfile;
  expense_date: string;
  receipt_url?: string | null;
  split_method: SplitMethod;
  participants: ExpenseParticipant[];
  created_at: string;
  updated_at: string;
}

export type BillCategory = 
  | 'electricity' 
  | 'water' 
  | 'internet' 
  | 'rent' 
  | 'maintenance' 
  | 'gas' 
  | 'custom';

export type BillRecurrence = 'none' | 'monthly' | 'quarterly' | 'yearly';

export interface Bill {
  id: string;
  household_id: string;
  title: string;
  category: BillCategory;
  amount_paise: number;
  due_date: string;
  paid_by_id?: string | null;
  paid_by?: UserProfile;
  recurrence: BillRecurrence;
  is_paid: boolean;
  paid_at?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settlement {
  id: string;
  household_id: string;
  payer_id: string;
  payer?: UserProfile;
  payee_id: string;
  payee?: UserProfile;
  amount_paise: number;
  upi_reference?: string | null;
  proof_url?: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  confirmed_at?: string | null;
}

export interface ShoppingItem {
  id: string;
  household_id: string;
  title: string;
  quantity: string;
  estimated_price_paise?: number | null;
  actual_price_paise?: number | null;
  assigned_to_id?: string | null;
  assigned_to?: UserProfile;
  is_purchased: boolean;
  purchased_by_id?: string | null;
  purchased_by?: UserProfile;
  purchased_at?: string | null;
  receipt_url?: string | null;
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface HouseholdTask {
  id: string;
  household_id: string;
  title: string;
  description?: string | null;
  assigned_to_id?: string | null;
  assigned_to?: UserProfile;
  due_date?: string | null;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  status: TaskStatus;
  created_at: string;
  completed_at?: string | null;
}

export type MarketplaceCategory = 
  | 'furniture' 
  | 'electronics' 
  | 'appliances' 
  | 'kitchen' 
  | 'books' 
  | 'study' 
  | 'bicycles' 
  | 'sports' 
  | 'home_essentials' 
  | 'other';

export type ProductCondition = 'brand_new' | 'like_new' | 'good' | 'fair';

export type ListingStatus = 'active' | 'paused' | 'sold' | 'moderation_flagged' | 'removed';

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  seller?: UserProfile;
  title: string;
  category: MarketplaceCategory;
  description: string;
  selling_price_paise: number;
  original_price_paise?: number | null;
  condition: ProductCondition;
  location: string;
  city: string;
  reason_for_selling?: string | null;
  is_moving_out_sale: boolean;
  moving_out_collection_title?: string | null;
  images: string[];
  status: ListingStatus;
  views_count: number;
  contact_preference: 'in_app_chat' | 'phone_on_request';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  listing_id?: string | null;
  listing?: MarketplaceListing;
  buyer_id: string;
  buyer?: UserProfile;
  seller_id: string;
  seller?: UserProfile;
  last_message?: string | null;
  last_message_at: string;
  unread_count_buyer: number;
  unread_count_seller: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: UserProfile;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 
    | 'expense_added' 
    | 'payment_due' 
    | 'settlement_requested' 
    | 'settlement_confirmed' 
    | 'shopping_item_added' 
    | 'chat_message' 
    | 'task_assigned' 
    | 'listing_inquiry' 
    | 'system';
  link_url?: string | null;
  is_read: boolean;
  created_at: string;
}

export type SubscriptionPlanId = 'free' | 'basic_plus' | 'premium';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price_inr_year: number;
  description: string;
  features: string[];
  is_active: boolean;
  ai_monthly_allowance: number;
  max_households: number;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan_id: SubscriptionPlanId;
  status: 'active' | 'expired' | 'canceled';
  current_period_start: string;
  current_period_end: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  created_at: string;
}

export interface AdminDashboardMetrics {
  total_users: number;
  active_users: number;
  new_registrations_last_30d: number;
  total_households: number;
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  total_subscriptions: number;
  active_premium_subscribers: number;
  verified_subscription_revenue_paise: number;
  pending_reports_count: number;
}
