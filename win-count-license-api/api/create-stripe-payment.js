// api/create-stripe-payment.js - Enhanced Version
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { machine_id, customer_email, payment_method = 'promptpay' } = req.body;

  if (!machine_id || !customer_email) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields (machine_id, customer_email)'
    });
  }

  try {
    console.log('🔄 Creating Stripe Payment Intent with PromptPay...');

    // Generate License Key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateSegment = (length) => 
      Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const licenseKey = `MONTH-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;

    // เลือก Payment Methods ตาม preference
    let paymentMethodTypes;
    let confirmationMethod = 'automatic';
    
    switch (payment_method) {
      case 'promptpay':
        paymentMethodTypes = ['promptpay'];
        confirmationMethod = 'manual'; // PromptPay ต้อง manual confirmation
        break;
      case 'card':
        paymentMethodTypes = ['card'];
        break;
      case 'both':
        paymentMethodTypes = ['promptpay', 'card'];
        break;
      default:
        paymentMethodTypes = ['promptpay', 'card'];
    }

    // Create Payment Intent with PromptPay support
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 14900, // ฿149 = 14900 satang
      currency: 'thb',
      payment_method_types: paymentMethodTypes,
      confirmation_method: confirmationMethod,
      metadata: {
        license_key: licenseKey,
        machine_id: machine_id,
        customer_email: customer_email,
        product: 'Win Count Monthly License',
        app_version: '1.0.0',
        payment_preference: payment_method
      },
      description: 'Win Count - Monthly License Subscription',
      receipt_email: customer_email,
      // สำหรับ PromptPay
      payment_method_options: {
        promptpay: {
          reference: `WC${Date.now().toString().slice(-8)}` // Reference number
        }
      }
    });

    // Store pending payment info
    if (!global.pendingPayments) {
      global.pendingPayments = new Map();
    }

    global.pendingPayments.set(paymentIntent.id, {
      license_key: licenseKey,
      machine_id: machine_id,
      customer_email: customer_email,
      amount: 149,
      currency: 'THB',
      status: 'PENDING',
      payment_intent_id: paymentIntent.id,
      payment_method: payment_method,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    });

    console.log('✅ Payment Intent created:', {
      id: paymentIntent.id,
      license_key: licenseKey,
      amount: 149,
      payment_methods: paymentMethodTypes
    });

    res.status(200).json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      license_key: licenseKey,
      amount: 149,
      currency: 'THB',
      payment_methods: paymentMethodTypes,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
      instructions: {
        promptpay: {
          th: 'สแกน QR Code ด้วยแอป Banking หรือ PromptPay',
          en: 'Scan QR Code with Banking app or PromptPay'
        },
        card: {
          th: 'ใส่ข้อมูลบัตรเครดิต/เดบิต',
          en: 'Enter credit/debit card information'
        }
      }
    });

  } catch (error) {
    console.error('❌ Stripe Payment Intent creation failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 