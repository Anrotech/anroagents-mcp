export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Agent {
  agentId: string;
  status: 'draft' | 'review' | 'active' | 'disabled';
  enabled: boolean;
  businessName: string;
  businessDescription: string;
  defaultGreeting: string;
  defaultLanguage: string;
  communicationTone: 'formal' | 'friendly' | 'neutral';
  businessHours: string;
  widgetTitle?: string;
  escalationRules: string;
  restrictions: string;
  bookingUrl?: string;
  calendarEnabled?: boolean;
  services: Array<{
    id: string;
    name: string;
    price: string;
    description: string;
  }>;
  contacts: {
    website: string;
    email: string;
    phone: string;
    address: string;
  };
  faq: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
