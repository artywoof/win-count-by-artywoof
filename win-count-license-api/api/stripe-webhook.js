import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    console.log('✅ Webhook signature verified');
  } catch (err) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      console.log('🎉 Payment succeeded:', paymentIntentSucceeded.id);
      
      await handlePaymentSuccess(paymentIntentSucceeded);
      break;

    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object;
      console.log('❌ Payment failed:', paymentIntentFailed.id);
      
      await handlePaymentFailure(paymentIntentFailed);
      break;

    case 'payment_intent.canceled':
      const paymentIntentCanceled = event.data.object;
      console.log('⚠️ Payment canceled:', paymentIntentCanceled.id);
      break;

    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent) {
  try {
    const licenseKey = paymentIntent.metadata.license_key;
    const machineId = paymentIntent.metadata.machine_id;
    const customerEmail = paymentIntent.metadata.customer_email;

    console.log('🔄 Activating license:', licenseKey);

    // Initialize storage
    if (!global.activeLicenses) {
      global.activeLicenses = new Map();
    }
    if (!global.completedPayments) {
      global.completedPayments = new Map();
    }

    // Calculate expiration date (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Activate license
    global.activeLicenses.set(licenseKey, {
      license_key: licenseKey,
      machine_id: machineId,
      customer_email: customerEmail,
      license_type: 'MONTHLY',
      payment_method: paymentIntent.charges?.data[0]?.payment_method_details?.type || 'unknown',
      amount_paid: paymentIntent.amount / 100, // Convert from cents to THB
      activated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'ACTIVE',
      payment_intent_id: paymentIntent.id,
      stripe_customer_id: paymentIntent.customer || null
    });

    // Move to completed payments
    const pendingPayment = global.pendingPayments?.get(paymentIntent.id);
    if (pendingPayment) {
      pendingPayment.status = 'COMPLETED';
      pendingPayment.completed_at = new Date().toISOString();
      pendingPayment.payment_method = paymentIntent.charges?.data[0]?.payment_method_details?.type;
      
      global.completedPayments.set(paymentIntent.id, pendingPayment);
      global.pendingPayments?.delete(paymentIntent.id);
    }

    console.log('🎉 License activated successfully:', {
      license_key: licenseKey,
      customer_email: customerEmail,
      expires_at: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('❌ License activation failed:', error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    const licenseKey = paymentIntent.metadata.license_key;
    
    console.log('💥 Payment failed for license:', licenseKey);

    // Update pending payment status
    const pendingPayment = global.pendingPayments?.get(paymentIntent.id);
    if (pendingPayment) {
      pendingPayment.status = 'FAILED';
      pendingPayment.failed_at = new Date().toISOString();
      pendingPayment.failure_reason = paymentIntent.last_payment_error?.message || 'Payment failed';
    }

    // Could send email notification here
    console.log('📧 Payment failure notification should be sent to:', paymentIntent.metadata.customer_email);

  } catch (error) {
    console.error('❌ Payment failure handling failed:', error);
  }
} 