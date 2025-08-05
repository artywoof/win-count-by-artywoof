// api/create-omise-payment.js - Omise Payment Integration
const omise = require('omise')({
  publicKey: 'pkey_test_64lscvwq1vrcw00i3fe',
  secretKey: 'skey_test_64lscvxfhjntnv34gv0',
});

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
    console.log('🔄 Creating Omise payment...');

    // Generate unique identifiers
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const paymentRef = `WC${timestamp}${randomSuffix}`;
    
    // Generate License Key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateSegment = (length) => 
      Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const licenseKey = `MONTH-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;

    // Payment method configuration
    const paymentConfig = {
      promptpay: {
        type: 'promptpay',
        description: 'PromptPay QR Code - สแกนจ่ายผ่านแอป Banking'
      },
      truewallet: {
        type: 'truewallet',
        description: 'True Wallet - จ่ายผ่าน True Wallet App'
      },
      card: {
        type: 'card',
        description: 'บัตรเครดิต/เดบิต - Visa, Mastercard, JCB'
      },
      rabbit_linepay: {
        type: 'rabbit_linepay', 
        description: 'Rabbit LINE Pay - สะดวกสำหรับคนกรุงเทพ'
      }
    };

    const selectedConfig = paymentConfig[payment_method] || paymentConfig.promptpay;

    // Create Omise Charge
    const charge = await omise.charges.create({
      amount: 14900, // ฿149 = 14900 satang
      currency: 'thb',
      source: {
        type: selectedConfig.type,
        // For PromptPay, Omise will generate QR automatically
      },
      description: `Win Count Monthly License - ${customer_email}`,
      metadata: {
        license_key: licenseKey,
        machine_id: machine_id,
        customer_email: customer_email,
        product: 'Win Count Monthly License',
        app_version: '1.0.0',
        payment_reference: paymentRef
      },
      return_uri: `${process.env.BASE_URL}/payment/omise/callback`,
      webhook_endpoints: [`${process.env.BASE_URL}/api/omise-webhook`]
    });

    // Store pending payment info
    if (!global.pendingPayments) {
      global.pendingPayments = new Map();
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    global.pendingPayments.set(charge.id, {
      license_key: licenseKey,
      machine_id: machine_id,
      customer_email: customer_email,
      amount: 149,
      currency: 'THB',
      status: 'PENDING',
      payment_method: payment_method,
      omise_charge_id: charge.id,
      payment_reference: paymentRef,
      created_at: new Date().toISOString(),
      expires_at: expiresAt
    });

    console.log('✅ Omise charge created:', {
      id: charge.id,
      license_key: licenseKey,
      amount: 149,
      payment_method: payment_method
    });

    // Prepare response based on payment method
    let responseData = {
      success: true,
      charge_id: charge.id,
      payment_reference: paymentRef,
      license_key: licenseKey,
      amount: 149,
      currency: 'THB',
      payment_method: payment_method,
      expires_at: expiresAt,
      status: charge.status,
      instructions: {
        th: selectedConfig.description,
        en: `Pay with ${selectedConfig.type}`
      }
    };

    // Add payment-specific data
    if (payment_method === 'promptpay' && charge.source) {
      responseData.qr_code_url = charge.source.scannable_code?.image?.download_uri;
      responseData.qr_code_data = charge.source.scannable_code?.value;
      responseData.promptpay_info = {
        reference_1: charge.reference,
        reference_2: paymentRef.slice(-4)
      };
    } else if (payment_method === 'truewallet' && charge.authorize_uri) {
      responseData.authorize_uri = charge.authorize_uri;
      responseData.deep_link = `truewallet://payment?uri=${encodeURIComponent(charge.authorize_uri)}`;
    } else if (payment_method === 'card' && charge.authorize_uri) {
      responseData.authorize_uri = charge.authorize_uri;
      responseData.card_form_url = charge.authorize_uri;
    } else if (payment_method === 'rabbit_linepay' && charge.authorize_uri) {
      responseData.authorize_uri = charge.authorize_uri;
      responseData.linepay_url = charge.authorize_uri;
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Omise payment creation failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
} 