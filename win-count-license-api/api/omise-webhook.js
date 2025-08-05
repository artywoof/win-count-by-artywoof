// api/omise-webhook.js - Omise Webhook Handler
const crypto = require('crypto');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const signature = req.headers['x-omise-signature'];
    
    const expectedSignature = crypto
      .createHmac('sha256', 'whsec_test_64lscvwq1vrcw00i3fe')
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid Omise webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('📡 Omise webhook received:', event.key, event.data?.object?.status);

    // Handle different event types
    switch (event.key) {
      case 'charge.complete':
        await handleChargeComplete(event.data.object);
        break;
        
      case 'charge.update':
        await handleChargeUpdate(event.data.object);
        break;
        
      case 'charge.failed':
        await handleChargeFailed(event.data.object);
        break;
        
      default:
        console.log(`⚠️ Unhandled Omise event: ${event.key}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Omise webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleChargeComplete(charge) {
  try {
    console.log('🎉 Omise charge completed:', charge.id);

    const licenseKey = charge.metadata.license_key;
    const machineId = charge.metadata.machine_id;
    const customerEmail = charge.metadata.customer_email;

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
      payment_method: charge.source?.type || 'unknown',
      amount_paid: charge.amount / 100, // Convert from satang to THB
      activated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'ACTIVE',
      omise_charge_id: charge.id,
      payment_provider: 'omise'
    });

    // Move to completed payments
    const pendingPayment = global.pendingPayments?.get(charge.id);
    if (pendingPayment) {
      pendingPayment.status = 'COMPLETED';
      pendingPayment.completed_at = new Date().toISOString();
      pendingPayment.payment_method_details = charge.source;
      
      global.completedPayments.set(charge.id, pendingPayment);
      global.pendingPayments?.delete(charge.id);
    }

    console.log('🎉 License activated successfully:', {
      license_key: licenseKey,
      customer_email: customerEmail,
      expires_at: expiresAt.toISOString(),
      payment_method: charge.source?.type
    });

    // Optional: Send success email to customer
    // await sendActivationEmail(customerEmail, licenseKey, expiresAt);

  } catch (error) {
    console.error('❌ License activation failed:', error);
  }
}

async function handleChargeUpdate(charge) {
  console.log('🔄 Charge updated:', charge.id, 'Status:', charge.status);
  
  // Update pending payment status
  const pendingPayment = global.pendingPayments?.get(charge.id);
  if (pendingPayment) {
    pendingPayment.status = charge.status.toUpperCase();
    pendingPayment.updated_at = new Date().toISOString();
  }
}

async function handleChargeFailed(charge) {
  try {
    console.log('💥 Omise charge failed:', charge.id);

    const licenseKey = charge.metadata.license_key;
    
    // Update pending payment status
    const pendingPayment = global.pendingPayments?.get(charge.id);
    if (pendingPayment) {
      pendingPayment.status = 'FAILED';
      pendingPayment.failed_at = new Date().toISOString();
      pendingPayment.failure_reason = charge.failure_message || 'Payment failed';
    }

    console.log('📧 Payment failure notification should be sent to:', charge.metadata.customer_email);

  } catch (error) {
    console.error('❌ Payment failure handling failed:', error);
  }
} 