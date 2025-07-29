export interface TherapistProfile {
  id: string;
  name: string;
  email: string;
  licenseNumber: string;
  specializations: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  sharingPermissions: {
    canViewMoodData: boolean;
    canViewHabitData: boolean;
    canViewInsights: boolean;
    canReceiveAlerts: boolean;
  };
  communicationPreferences: {
    reportFrequency: 'weekly' | 'monthly' | 'as_needed';
    alertThreshold: 'low' | 'medium' | 'high';
    preferredFormat: 'summary' | 'detailed' | 'raw_data';
  };
}

export interface HealthcareProvider {
  id: string;
  name: string;
  type: 'primary_care' | 'psychiatrist' | 'psychologist' | 'counselor' | 'coach';
  facility: string;
  contactInfo: {
    email: string;
    phone?: string;
    address?: string;
  };
  integrationCapabilities: {
    supportsHL7: boolean;
    supportsCCDA: boolean;
    hasAPIAccess: boolean;
    requiresManualExport: boolean;
  };
}

export interface ClinicalAlert {
  id: string;
  type: 'mood_decline' | 'habit_abandonment' | 'risk_pattern' | 'crisis_indicator';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  triggeredBy: {
    dataType: 'mood' | 'habit' | 'pattern';
    threshold: number;
    actualValue: number;
  };
  message: string;
  recommendations: string[];
  requiresImmediateAction: boolean;
  notificationsSent: {
    therapist: boolean;
    healthcare_provider: boolean;
    emergency_contact: boolean;
  };
  timestamp: string;
  resolvedAt?: string;
}

export interface ResearchStudy {
  id: string;
  title: string;
  description: string;
  institution: string;
  principalInvestigator: string;
  ethicsApproval: string;
  participantCriteria: {
    minAge: number;
    maxAge: number;
    conditions: string[];
    exclusions: string[];
  };
  dataRequirements: {
    moodData: boolean;
    habitData: boolean;
    demographicData: boolean;
    longitudinalData: boolean;
    minimumDuration: number; // months
  };
  compensation: {
    type: 'monetary' | 'app_features' | 'none';
    amount?: number;
    description?: string;
  };
  privacyLevel: 'anonymous' | 'pseudonymous' | 'identifiable';
  dataRetention: number; // years
  status: 'recruiting' | 'active' | 'completed' | 'suspended';
}