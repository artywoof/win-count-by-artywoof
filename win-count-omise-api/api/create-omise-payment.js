// api/create-omise-payment.js - Omise Payment Integration
const omise = require('omise')({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
});

const { 
  validatePaymentRequest, 
  checkRateLimit, 
  sanitizeErrorMessage,
  generateSecureRandomString 
} = require('../utils/security');

function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'MONTH-';
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!checkRateLimit(clientIP, 50, 60000)) { // 50 requests per minute
      return res.status(429).json({
        error: 'Rate limit exceeded',
        details: 'Too many requests. Please try again later.'
      });
    }

    // Input validation
    try {
      validatePaymentRequest(req);
    } catch (validationError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: sanitizeErrorMessage(validationError)
      });
    }

    const { machine_id, customer_email, payment_method } = req.body;

    // Generate license key
    const licenseKey = generateLicenseKey();
    
    // Initialize storage
    if (!global.pendingPayments) {
      global.pendingPayments = new Map();
    }

    // Create Omise charge based on payment method
    let charge;
    let paymentData = {};

    switch (payment_method) {
      case 'promptpay':
        // PromptPay (แนะนำ - ฟรีค่าธรรมเนียม)
        charge = await omise.charges.create({
          amount: 14900, // ฿149
          currency: 'thb',
          source: {
            type: 'promptpay'
          },
          metadata: {
            license_key: licenseKey,
            machine_id: machine_id,
            customer_email: customer_email,
            payment_method: 'promptpay'
          }
        });
        
        // Response จะมี QR Code URL
        paymentData = {
          qr_code_url: charge.source.scannable_code.image.download_uri,
          payment_type: 'QR_CODE',
          instructions: 'สแกน QR Code ผ่านแอป Banking ทุกธนาคาร',
          fees: 'ฟรี (0%)',
          popular: true
        };
        break;

      case 'truewallet':
        // True Wallet
        charge = await omise.charges.create({
          amount: 14900,
          currency: 'thb',
          source: {
            type: 'truewallet'
          },
          return_uri: 'https://win-count-by-artywoof.vercel.app/callback',
          metadata: {
            license_key: licenseKey,
            machine_id: machine_id,
            customer_email: customer_email,
            payment_method: 'truewallet'
          }
        });
        
        // Response จะมี authorize_uri สำหรับเปิด True Wallet
        paymentData = {
          authorize_uri: charge.authorize_uri,
          payment_type: 'DEEP_LINK',
          instructions: 'กดเพื่อเปิด True Wallet App',
          fees: '1.65%',
          popular: true
        };
        break;

      case 'card':
        // บัตรเครดิต/เดบิต
        charge = await omise.charges.create({
          amount: 14900,
          currency: 'thb',
          source: {
            type: 'card'
          },
          return_uri: 'https://win-count-by-artywoof.vercel.app/callback',
          metadata: {
            license_key: licenseKey,
            machine_id: machine_id,
            customer_email: customer_email,
            payment_method: 'card'
          }
        });
        
        // Response จะมี authorize_uri สำหรับฟอร์มกรอกบัตร
        paymentData = {
          authorize_uri: charge.authorize_uri,
          payment_type: 'CARD_FORM',
          instructions: 'กรอกข้อมูลบัตรเครดิต/เดบิต',
          fees: '2.65%',
          popular: false
        };
        break;

      default:
        return res.status(400).json({
          error: 'Invalid payment method. Supported: promptpay, truewallet, card'
        });
    }

    // Store pending payment
    global.pendingPayments.set(charge.id, {
      charge_id: charge.id,
      license_key: licenseKey,
      machine_id: machine_id,
      customer_email: customer_email,
      amount: 149,
      payment_method: payment_method,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      payment_data: paymentData
    });

    console.log('🎯 Omise payment created:', {
      charge_id: charge.id,
      payment_method: payment_method,
      amount: 149,
      license_key: licenseKey,
      fees: paymentData.fees
    });

    res.status(200).json({
      success: true,
      charge_id: charge.id,
      payment_reference: `WC${Date.now()}`,
      license_key: licenseKey,
      amount: 149,
      payment_method: payment_method,
      fees: paymentData.fees,
      popular: paymentData.popular,
      ...paymentData
    });

  } catch (error) {
    console.error('❌ Omise payment creation failed:', error);
    res.status(500).json({
      error: 'Payment creation failed',
      details: sanitizeErrorMessage(error)
    });
  }
} 