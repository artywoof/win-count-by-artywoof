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

  const { machine_id, customer_email } = req.body;

  try {
    console.log('🔄 Creating Stripe Payment Intent...');

    // Generate License Key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateSegment = (length) => 
      Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const licenseKey = `MONTH-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 14900, // ฿149 = 14900 satang
      currency: 'thb',
      payment_method_types: ['promptpay', 'card'],
      metadata: {
        license_key: licenseKey,
        machine_id: machine_id,
        customer_email: customer_email,
        product: 'Win Count Monthly License',
        app_version: '1.0.0'
      },
      description: 'Win Count - Monthly License Subscription',
      receipt_email: customer_email
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
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

    console.log('✅ Payment Intent created:', {
      id: paymentIntent.id,
      license_key: licenseKey,
      amount: 149
    });

    res.status(200).json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      license_key: licenseKey,
      amount: 149,
      currency: 'THB',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      payment_methods: ['promptpay', 'card'],
      instructions: {
        th: 'เลือกวิธีชำระเงินที่ต้องการ: PromptPay หรือบัตรเครดิต/เดบิต',
        en: 'Choose your preferred payment method: PromptPay or Credit/Debit Card'
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