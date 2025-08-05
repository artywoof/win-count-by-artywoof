// api/truewallet-webhook.js - True Wallet Webhook Handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    // Verify webhook signature (True Wallet specific)
    const expectedSignature = generateTrueWalletSignature(
      JSON.stringify(webhookData), 
      process.env.TRUEWALLET_WEBHOOK_SECRET
    );
    
    const receivedSignature = req.headers['x-truewallet-signature'];
    
    if (expectedSignature !== receivedSignature) {
      console.error('❌ Invalid True Wallet webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { reference_id, status, payment_id } = webhookData;

    if (status === 'completed' || status === 'success') {
      console.log('🎉 True Wallet payment successful:', reference_id);
      
      // Activate license
      await activateLicense(reference_id, 'truewallet', webhookData);
      
    } else if (status === 'failed' || status === 'cancelled') {
      console.log('❌ True Wallet payment failed:', reference_id);
      
      // Handle payment failure
      await handlePaymentFailure(reference_id, 'truewallet', webhookData);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ True Wallet webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

function generateTrueWalletSignature(payload, secret) {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

async function activateLicense(paymentRef, paymentMethod, webhookData) {
  // Implementation similar to Stripe webhook handler
  // Move from pendingPayments to activeLicenses
  console.log(`🔑 Activating license from ${paymentMethod}:`, paymentRef);
  
  // Activate license logic here...
} 