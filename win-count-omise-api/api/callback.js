// api/callback.js - Omise Payment Callback Handler
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { charge_id, status } = req.query;

    console.log('🔄 Payment callback received:', { charge_id, status });

    // Redirect to appropriate page based on status
    if (status === 'successful') {
      // Redirect to success page
      res.redirect(302, 'https://win-count-by-artywoof.vercel.app/payment-success');
    } else if (status === 'failed') {
      // Redirect to failure page
      res.redirect(302, 'https://win-count-by-artywoof.vercel.app/payment-failed');
    } else {
      // Redirect to pending page
      res.redirect(302, 'https://win-count-by-artywoof.vercel.app/payment-pending');
    }

  } catch (error) {
    console.error('❌ Callback handling failed:', error);
    // Redirect to error page
    res.redirect(302, 'https://win-count-by-artywoof.vercel.app/payment-error');
  }
} 