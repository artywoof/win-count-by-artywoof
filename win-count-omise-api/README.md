# Win Count Omise Payment API

Backend API สำหรับระบบชำระเงิน Win Count ผ่าน Omise

## 🚀 Features

- **PromptPay** - QR Code scanning
- **True Wallet** - Direct app integration
- **Credit/Debit Cards** - Visa, Mastercard, JCB
- **Webhook Handling** - Real-time payment notifications
- **License Management** - Automatic license activation

## 📁 Project Structure

```
win-count-omise-api/
├── api/
│   ├── create-omise-payment.js
│   ├── omise-webhook.js
│   ├── verify-license.js
│   └── callback.js
├── utils/
│   └── security.js
├── package.json
├── vercel.json
└── README.md
```

## 🔧 Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   ```env
   # Omise Configuration
   OMISE_PUBLIC_KEY=pkey_test_64lscvwq1vrcw00i3fe
   OMISE_SECRET_KEY=skey_test_64lscvxfhjntnv34gv0
   OMISE_WEBHOOK_SECRET=whsec_test_64lscvwq1vrcw00i3fe
   
   # API Configuration
   API_BASE_URL=https://win-count-omise-api.vercel.app
   
   # Security Configuration
   RATE_LIMIT_PAYMENT=50
   RATE_LIMIT_LICENSE=100
   RATE_LIMIT_WINDOW=60000
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

## 🔗 API Endpoints

### POST `/api/create-omise-payment`
สร้างการชำระเงินใหม่

**Request Body**:
```json
{
  "machine_id": "unique_machine_id",
  "customer_email": "user@example.com",
  "payment_method": "promptpay"
}
```

**Supported Payment Methods**:
- `promptpay` - QR Code scanning (ฟรี)
- `truewallet` - True Wallet App (1.65%)
- `card` - Credit/Debit cards (2.65%)

**Response**:
```json
{
  "success": true,
  "charge_id": "chrg_test_xxx",
  "payment_reference": "WC1234567890",
  "license_key": "MONTH-XXXX-XXXX-XXXX",
  "amount": 149,
  "payment_method": "promptpay",
  "fees": "ฟรี (0%)",
  "popular": true,
  "qr_code_url": "https://...",
  "authorize_uri": "https://..."
}
```

### POST `/api/omise-webhook`
รับ webhook notifications จาก Omise

### POST `/api/verify-license`
ตรวจสอบ license validity

## 🛡️ Security

- **Webhook Signature Verification**: HMAC-SHA256 with environment variables
- **API Key Protection**: Environment variables for all sensitive keys
- **Input Validation**: Comprehensive request validation with sanitized errors
- **Rate Limiting**: 50 requests/minute for payments, 100 requests/minute for license verification
- **Error Handling**: Sanitized error messages to prevent information leakage
- **Machine Binding**: License keys are bound to specific machine IDs
- **CORS Protection**: Configured for frontend domain

## 📊 Payment Methods

| Method | Fee | Processing Time | Popular | Recommended |
|--------|-----|-----------------|---------|-------------|
| PromptPay | 0% | Instant | ✅ | ✅ |
| True Wallet | 1.65% | Instant | ✅ | ❌ |
| Credit/Debit | 2.65% | Instant | ❌ | ❌ |

## 🔄 Webhook Events

- `charge.complete` - Payment successful
- `charge.update` - Payment status updated
- `charge.failed` - Payment failed

## 📝 License

MIT License - Win Count by ArtYWoof 