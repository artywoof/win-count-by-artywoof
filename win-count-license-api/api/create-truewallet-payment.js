// api/create-truewallet-payment.js - True Wallet Integration
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

  const { machine_id, customer_email, customer_phone } = req.body;

  if (!machine_id || !customer_email) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields (machine_id, customer_email)'
    });
  }

  try {
    console.log('📱 Creating True Wallet payment...');

    // Generate unique payment reference
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const paymentRef = `TW${timestamp}${randomSuffix}`;
    
    // Generate License Key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateSegment = (length) => 
      Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const licenseKey = `MONTH-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;

    // True Wallet Payment Request
    const trueWalletPayload = {
      merchant_id: process.env.TRUEWALLET_MERCHANT_ID,
      reference_id: paymentRef,
      amount: 149.00,
      currency: 'THB',
      description: 'Win Count Monthly License',
      customer: {
        email: customer_email,
        phone: customer_phone || null
      },
      return_url: `${process.env.BASE_URL}/payment/truewallet/success`,
      cancel_url: `${process.env.BASE_URL}/payment/truewallet/cancel`,
      webhook_url: `${process.env.BASE_URL}/api/truewallet-webhook`,
      metadata: {
        license_key: licenseKey,
        machine_id: machine_id,
        product: 'monthly_license'
      }
    };

    // True Wallet API Call
    const trueWalletResponse = await fetch('https://api.truewallet.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TRUEWALLET_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(trueWalletPayload)
    });

    const trueWalletResult = await trueWalletResponse.json();

    if (!trueWalletResponse.ok) {
      throw new Error(`True Wallet API Error: ${trueWalletResult.message || 'Unknown error'}`);
    }

    // Store pending payment
    if (!global.pendingPayments) {
      global.pendingPayments = new Map();
    }

    global.pendingPayments.set(paymentRef, {
      license_key: licenseKey,
      machine_id: machine_id,
      customer_email: customer_email,
      customer_phone: customer_phone,
      amount: 149,
      currency: 'THB',
      status: 'PENDING',
      payment_method: 'truewallet',
      truewallet_payment_id: trueWalletResult.payment_id,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });

    console.log('✅ True Wallet payment created:', {
      payment_ref: paymentRef,
      license_key: licenseKey,
      truewallet_payment_id: trueWalletResult.payment_id
    });

    res.status(200).json({
      success: true,
      payment_ref: paymentRef,
      license_key: licenseKey,
      amount: 149,
      currency: 'THB',
      payment_method: 'truewallet',
      truewallet_url: trueWalletResult.payment_url, // URL สำหรับเปิด True Wallet
      qr_code: trueWalletResult.qr_code, // QR Code สำหรับสแกน
      deep_link: trueWalletResult.deep_link, // Deep link เปิดแอป
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      instructions: {
        th: 'กดปุ่มด้านล่างเพื่อเปิด True Wallet หรือสแกน QR Code',
        en: 'Tap the button below to open True Wallet or scan the QR Code'
      }
    });

  } catch (error) {
    console.error('❌ True Wallet payment creation failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 