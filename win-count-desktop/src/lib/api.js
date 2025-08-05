// src/lib/api.js - API Client for Win Count Desktop

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://win-count-omise-api.vercel.app';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Create Omise Payment
  async createPayment(paymentData) {
    return this.request('/api/create-omise-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Verify License
  async verifyLicense(licenseData) {
    return this.request('/api/verify-license', {
      method: 'POST',
      body: JSON.stringify(licenseData),
    });
  }

  // Check Payment Status
  async checkPaymentStatus(paymentData) {
    return this.request('/api/check-payment-status', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }
}

export const apiClient = new ApiClient();

// Payment Methods Configuration
export const PAYMENT_METHODS = {
  PROMPTPAY: {
    id: 'promptpay',
    name: 'PromptPay',
    icon: '📱',
    description: 'สแกน QR Code ผ่านแอป Banking ทุกธนาคาร',
    fees: 'ฟรี (0%)',
    feeRate: 0,
    popular: true,
    recommended: true,
  },
  TRUEWALLET: {
    id: 'truewallet',
    name: 'True Wallet',
    icon: '💙',
    description: 'จ่ายผ่าน True Wallet App',
    fees: '1.65%',
    feeRate: 0.0165,
    popular: true,
    recommended: false,
  },
  CARD: {
    id: 'card',
    name: 'บัตรเครดิต/เดบิต',
    icon: '💳',
    description: 'Visa, Mastercard, JCB ทุกธนาคาร',
    fees: '2.65%',
    feeRate: 0.0265,
    popular: false,
    recommended: false,
  },
};

// Price Calculation
export function calculateFinalAmount(basePrice = 149, paymentMethod) {
  const method = PAYMENT_METHODS[paymentMethod?.toUpperCase()];
  if (!method) return basePrice;
  
  if (method.id === 'promptpay') return basePrice; // ฟรี
  
  return Math.ceil(basePrice * (1 + method.feeRate));
}

// Error Handling
export function handleApiError(error) {
  console.error('API Error:', error);
  
  const errorMessages = {
    'Network Error': 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
    'API Error: 400': 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
    'API Error: 401': 'การยืนยันตัวตนล้มเหลว',
    'API Error: 403': 'ไม่มีสิทธิ์เข้าถึง',
    'API Error: 404': 'ไม่พบข้อมูลที่ต้องการ',
    'API Error: 500': 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์',
  };

  return errorMessages[error.message] || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
} 