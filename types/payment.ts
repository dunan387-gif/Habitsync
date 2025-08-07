// Payment Gateway Types
export type PaymentGateway = '2checkout' | 'app_store' | 'google_play';

// Payment Method Types
export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'bank_transfer';

// Currency Types
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR';

// Subscription Status
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';

// Payment Intent Status
export type PaymentIntentStatus = 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';

// Payment Request
export interface PaymentRequest {
  amount: number;
  currency: Currency;
  description: string;
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  gateway: PaymentGateway;
  productId: string;
  period: 'monthly' | 'yearly';
}

// Payment Response
export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentIntentId?: string;
  status: PaymentIntentStatus;
  error?: PaymentError;
  gateway: PaymentGateway;
  amount: number;
  currency: Currency;
  timestamp: string;
}

// Payment Error
export interface PaymentError {
  code: string;
  message: string;
  type: 'card_error' | 'validation_error' | 'rate_limit_error' | 'invalid_request_error' | 'authentication_error' | 'api_connection_error' | 'api_error';
  declineCode?: string;
  param?: string;
}

// Customer Information
export interface CustomerInfo {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  metadata?: Record<string, string>;
  gateway: PaymentGateway;
  gatewayCustomerId?: string;
}

// Subscription Information
export interface SubscriptionInfo {
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  gateway: PaymentGateway;
  gatewaySubscriptionId?: string;
  productId: string;
  period: 'monthly' | 'yearly';
  amount: number;
  currency: Currency;
}

// Webhook Event
export interface WebhookEvent {
  id: string;
  type: string;
  gateway: PaymentGateway;
  data: any;
  timestamp: string;
  signature?: string;
}

// Pricing Plan
export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  gatewayProductId: string;
}

// Subscription Tier
export interface SubscriptionTier {
  id: string;
  name: string;
  features: {
    maxHabits: number;
    maxAnalytics: number;
    aiFeatures: boolean;
    customThemes: boolean;
    prioritySupport: boolean;
    exportData: boolean;
    teamFeatures: boolean;
  };
  pricingPlans: PricingPlan[];
}

// Payment Analytics Event
export interface PaymentAnalyticsEvent {
  type: 'payment_success' | 'payment_failed' | 'subscription_created' | 'subscription_canceled' | 'subscription_updated';
  gateway: PaymentGateway;
  amount: number;
  currency: Currency;
  userId: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// Database Types
export interface PaymentIntent {
  id: string;
  user_id: string;
  gateway: PaymentGateway;
  amount: number;
  currency: Currency;
  status: PaymentIntentStatus;
  product_id: string;
  period: 'monthly' | 'yearly';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  gateway: PaymentGateway;
  gateway_subscription_id?: string;
  product_id: string;
  period: 'monthly' | 'yearly';
  amount: number;
  currency: Currency;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: Record<string, any>;
  gateway: PaymentGateway;
  gateway_customer_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  gateway: PaymentGateway;
  gateway_product_id: string;
  price: number;
  currency: Currency;
  period: 'monthly' | 'yearly';
  features: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentAnalytics {
  id: string;
  event_type: string;
  gateway: PaymentGateway;
  amount: number;
  currency: Currency;
  user_id: string;
  metadata?: Record<string, any>;
  timestamp: string;
} 