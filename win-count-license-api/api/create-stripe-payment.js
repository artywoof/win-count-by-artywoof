// api/create-stripe-payment.js - Stripe Payment Integration
import Stripe from 'stripe';
import { STRIPE_CONFIG, STRIPE_PRODUCTS, PAYMENT_CONFIG } from '../config/stripe.js';

const stripe = new Stripe(STRIPE_CONFIG.secretKey);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  console.log('📡 Stripe payment request:', req.body);

  const { machine_id, customer_email, payment_method = 'promptpay' } = req.body || {};
  
  if (!machine_id || !customer_email) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields (machine_id, customer_email)'
    });
    return;
  }

  try {
    console.log('🔄 Creating Stripe payment session...');
    
    // Generate unique identifiers
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const paymentRef = `WC${timestamp}${randomSuffix}`;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateSegment = (length) => Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const licenseKey = `MONTH-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;
    
    const expiresAt = new Date(timestamp + 15 * 60 * 1000).toISOString();
    
    // Initialize global storage
    if (!global.pendingPurchases) {
      global.pendingPurchases = new Map();
    }
    
    // Store pending purchase
    global.pendingPurchases.set(paymentRef, {
      license_key: licenseKey,
      machine_id: machine_id,
      customer_email: customer_email,
      amount: STRIPE_PRODUCTS.monthly_license.price,
      currency: PAYMENT_CONFIG.currency,
      status: 'PENDING',
      payment_method: payment_method,
      created_at: new Date().toISOString(),
      expires_at: expiresAt
    });
    
    console.log(`💾 Stored pending Stripe purchase: ${paymentRef}`);
    
    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: STRIPE_PRODUCTS.monthly_license.price * 100, // Stripe uses cents
      currency: PAYMENT_CONFIG.currency,
      payment_method_types: payment_method === 'promptpay' ? ['card'] : ['card'],
      metadata: {
        payment_ref: paymentRef,
        license_key: licenseKey,
        machine_id: machine_id,
        customer_email: customer_email,
        product: 'monthly_license'
      },
      description: `Win Count Monthly License - ${customer_email}`,
      receipt_email: customer_email
    });
    
    console.log('✅ Stripe Payment Intent created:', paymentIntent.id);
    
    const response = {
      success: true,
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      payment_ref: paymentRef,
      license_key: licenseKey,
      amount: STRIPE_PRODUCTS.monthly_license.price,
      currency: PAYMENT_CONFIG.currency,
      expires_at: expiresAt,
      payment_method: payment_method,
      stripe_publishable_key: STRIPE_CONFIG.publishableKey,
      product_info: {
        name: STRIPE_PRODUCTS.monthly_license.name,
        description: STRIPE_PRODUCTS.monthly_license.description,
        price: STRIPE_PRODUCTS.monthly_license.price
      },
      server_time: new Date().toISOString(),
      debug_info: {
        total_pending: global.pendingPurchases.size,
        stripe_account: stripe.getAccountId ? await stripe.getAccountId() : 'test'
      }
    };
    
    console.log('✅ Stripe payment session created successfully');
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Stripe API Error:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create Stripe payment session: ' + error.message,
      error_details: error.stack,
      timestamp: new Date().toISOString()
    });
  }
} 