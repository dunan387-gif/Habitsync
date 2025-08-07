import { OFFLINE_MODE } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionStatus } from '@/types';

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  originalPrice?: number;
  features: string[];
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  subscriptionStatus?: SubscriptionStatus;
}

export class PaymentService {
  /**
   * Process payment for subscription upgrade
   */
  static async processPayment(plan: PaymentPlan): Promise<PaymentResult> {
    if (OFFLINE_MODE) {
      // Simulate payment processing for offline mode
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (plan.period === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.period === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscriptionStatus: SubscriptionStatus = {
        tier: 'pro',
        isActive: true,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true,
        platform: 'web', // Changed from 'offline' to 'web'
        period: plan.period,
        planId: plan.id
      };

      return {
        success: true,
        transactionId: 'offline-txn-' + Date.now(),
        subscriptionStatus
      };
    }

    try {
      // For web platform, integrate with Stripe or similar payment processor
      if (typeof window !== 'undefined') {
        return await this.processWebPayment(plan);
      }
      
      // For mobile platforms, integrate with native payment systems
      return await this.processMobilePayment(plan);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment processing failed'
      };
    }
  }

  /**
   * Process payment for web platform
   */
  private static async processWebPayment(plan: PaymentPlan): Promise<PaymentResult> {
    try {
      // This would integrate with Stripe, PayPal, or other web payment processors
      // For now, we'll simulate the payment process
      
      // Simulate API call to payment processor
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          amount: plan.price,
          currency: 'USD',
          period: plan.period
        })
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      const result = await response.json();
      
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (plan.period === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.period === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscriptionStatus: SubscriptionStatus = {
        tier: 'pro',
        isActive: true,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true,
        platform: 'web',
        period: plan.period,
        planId: plan.id
      };

      return {
        success: true,
        transactionId: result.transactionId,
        subscriptionStatus
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Web payment processing failed'
      };
    }
  }

  /**
   * Process payment for mobile platform
   */
  private static async processMobilePayment(plan: PaymentPlan): Promise<PaymentResult> {
    try {
      // This would integrate with Google Play Billing or App Store Connect
      // For now, we'll simulate the payment process
      
      // Simulate native payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (plan.period === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.period === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscriptionStatus: SubscriptionStatus = {
        tier: 'pro',
        isActive: true,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true,
        platform: 'android', // Changed from 'mobile' to 'android'
        period: plan.period,
        planId: plan.id
      };

      return {
        success: true,
        transactionId: 'mobile-txn-' + Date.now(),
        subscriptionStatus
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Mobile payment processing failed'
      };
    }
  }

  /**
   * Restore purchases from app stores
   */
  static async restorePurchases(): Promise<SubscriptionStatus | null> {
    if (OFFLINE_MODE) {
      // Check for existing subscription in local storage
      const storedSubscription = await AsyncStorage.getItem('subscription_status');
      if (storedSubscription) {
        const subscription: SubscriptionStatus = JSON.parse(storedSubscription);
        if (subscription.tier === 'pro' && subscription.isActive) {
          return subscription;
        }
      }
      return null;
    }

    try {
      // For web platform, check with backend
      if (typeof window !== 'undefined') {
        return await this.restoreWebPurchases();
      }
      
      // For mobile platforms, check with app stores
      return await this.restoreMobilePurchases();
    } catch (error: any) {
      console.error('Failed to restore purchases:', error);
      return null;
    }
  }

  /**
   * Restore purchases for web platform
   */
  private static async restoreWebPurchases(): Promise<SubscriptionStatus | null> {
    try {
      // Check with backend for existing subscription
      const response = await fetch('/api/subscriptions/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.subscription || null;
    } catch (error) {
      console.error('Failed to restore web purchases:', error);
      return null;
    }
  }

  /**
   * Restore purchases for mobile platform
   */
  private static async restoreMobilePurchases(): Promise<SubscriptionStatus | null> {
    try {
      // This would integrate with Google Play Billing or App Store Connect
      // For now, we'll simulate the restoration process
      
      // Simulate checking with app stores
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return null to indicate no active subscription found
      return null;
    } catch (error) {
      console.error('Failed to restore mobile purchases:', error);
      return null;
    }
  }

  /**
   * Get available payment plans
   */
  static async getPaymentPlans(): Promise<PaymentPlan[]> {
    return [
      {
        id: 'pro-monthly',
        name: 'Pro Monthly',
        price: 9.99,
        period: 'monthly',
        features: [
          'Unlimited habits',
          'Advanced analytics',
          'AI coaching',
          'Premium themes',
          'Data export'
        ]
      },
      {
        id: 'pro-yearly',
        name: 'Pro Yearly',
        price: 99.99,
        originalPrice: 119.88,
        period: 'yearly',
        features: [
          'Unlimited habits',
          'Advanced analytics',
          'AI coaching',
          'Premium themes',
          'Data export',
          'Priority support'
        ]
      }
    ];
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(): Promise<boolean> {
    if (OFFLINE_MODE) {
      // Simulate subscription cancellation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }

    try {
      // For web platform
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/subscriptions/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        return response.ok;
      }
      
      // For mobile platforms
      return await this.cancelMobileSubscription();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  /**
   * Cancel mobile subscription
   */
  private static async cancelMobileSubscription(): Promise<boolean> {
    try {
      // This would integrate with Google Play Billing or App Store Connect
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error('Failed to cancel mobile subscription:', error);
      return false;
    }
  }
} 