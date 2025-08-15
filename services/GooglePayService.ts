import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionStatus, SubscriptionTier } from '@/types';

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  features: string[];
  trialDays?: number;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  subscriptionId?: string;
}

class GooglePayService {
  private static instance: GooglePayService;
  private isInitialized = false;

  static getInstance(): GooglePayService {
    if (!GooglePayService.instance) {
      GooglePayService.instance = new GooglePayService();
    }
    return GooglePayService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if Google Pay is available
      const isAvailable = await this.checkGooglePayAvailability();
      this.isInitialized = isAvailable;
      return isAvailable;
    } catch (error) {
      console.error('Failed to initialize Google Pay:', error);
      this.isInitialized = false;
      return false;
    }
  }

  private async checkGooglePayAvailability(): Promise<boolean> {
    try {
      // For now, we'll simulate Google Pay availability
      // In a real implementation, you would check if Google Pay is available on the device
      return true;
    } catch (error) {
      console.error('Error checking Google Pay availability:', error);
      return false;
    }
  }

  async processPayment(plan: PaymentPlan): Promise<PaymentResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Simulate payment processing
      console.log('Processing payment for plan:', plan);
      
      // In a real implementation, you would:
      // 1. Present Google Pay payment sheet
      // 2. Process the payment with your backend
      // 3. Handle the response

      // For now, simulate successful payment
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store subscription data
      await this.storeSubscriptionData({
        tier: plan.id,
        isActive: true,
        startDate: new Date().toISOString(),
        endDate: this.calculateEndDate(plan.period),
        autoRenew: true,
        platform: 'google_pay',
        period: plan.period,
        planId: plan.id,
        transactionId: transactionId
      });

      return {
        success: true,
        transactionId,
        subscriptionId
      };
    } catch (error) {
      console.error('Payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  // Add a static method for easy access
  static async processPayment(plan: PaymentPlan): Promise<PaymentResult> {
    return GooglePayService.getInstance().processPayment(plan);
  }

  async restorePurchases(): Promise<SubscriptionStatus | null> {
    try {
      // In a real implementation, you would:
      // 1. Check with Google Play Store for existing purchases
      // 2. Verify the purchases with your backend
      // 3. Return the subscription status

      // For now, we'll check local storage
      const subscriptionData = await this.getStoredSubscriptionData();
      return subscriptionData;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return null;
    }
  }

  static async restorePurchases(): Promise<SubscriptionStatus | null> {
    return GooglePayService.getInstance().restorePurchases();
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      // In a real implementation, you would:
      // 1. Cancel the subscription with Google Play Store
      // 2. Update your backend
      // 3. Update local storage

      // For now, we'll just clear local storage
      await AsyncStorage.removeItem('subscription_data');
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
    try {
      const subscriptionData = await this.getStoredSubscriptionData();
      
      if (!subscriptionData) {
        return null;
      }

      // Check if subscription is still valid
      const now = new Date();
      const endDate = subscriptionData.endDate ? new Date(subscriptionData.endDate) : null;
      
      if (endDate && now > endDate) {
        // Subscription has expired
        await this.updateSubscriptionStatus(false);
        return {
          ...subscriptionData,
          isActive: false
        };
      }

      return subscriptionData;
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return null;
    }
  }

  private async storeSubscriptionData(subscription: SubscriptionStatus): Promise<void> {
    try {
      await AsyncStorage.setItem('subscription_data', JSON.stringify(subscription));
    } catch (error) {
      console.error('Failed to store subscription data:', error);
      throw error;
    }
  }

  private async getStoredSubscriptionData(): Promise<SubscriptionStatus | null> {
    try {
      const data = await AsyncStorage.getItem('subscription_data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get stored subscription data:', error);
      return null;
    }
  }

  private async updateSubscriptionStatus(isActive: boolean): Promise<void> {
    try {
      const subscriptionData = await this.getStoredSubscriptionData();
      if (subscriptionData) {
        subscriptionData.isActive = isActive;
        await this.storeSubscriptionData(subscriptionData);
      }
    } catch (error) {
      console.error('Failed to update subscription status:', error);
    }
  }

  private calculateEndDate(period: 'monthly' | 'yearly'): string {
    const now = new Date();
    if (period === 'monthly') {
      now.setMonth(now.getMonth() + 1);
    } else {
      now.setFullYear(now.getFullYear() + 1);
    }
    return now.toISOString();
  }

  // Development/testing methods
  async simulatePayment(plan: PaymentPlan): Promise<PaymentResult> {
    return this.processPayment(plan);
  }

  async clearSubscriptionData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('subscription_data');
    } catch (error) {
      console.error('Failed to clear subscription data:', error);
    }
  }

  async setMockSubscription(subscription: SubscriptionStatus): Promise<void> {
    await this.storeSubscriptionData(subscription);
  }
}

export default GooglePayService.getInstance();
