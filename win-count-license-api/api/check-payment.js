// api/check-payment.js - แก้ไข CORS
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

  const { payment_ref } = req.body || {};
  
  if (!payment_ref) {
    res.status(400).json({
      success: false,
      message: 'Missing payment_ref'
    });
    return;
  }

  console.log('📡 Check payment request:', payment_ref);

  // Initialize storage if needed
  if (!global.pendingPurchases) {
    global.pendingPurchases = new Map();
  }
  if (!global.completedPurchases) {
    global.completedPurchases = new Map();
  }

  // Check if purchase exists
  const purchase = global.pendingPurchases.get(payment_ref);
  if (!purchase) {
    console.log('❌ Payment reference not found:', payment_ref);
    res.status(404).json({
      success: false,
      status: 'NOT_FOUND',
      message: 'Payment reference not found'
    });
    return;
  }

  // Check if expired
  const now = new Date();
  const expiresAt = new Date(purchase.expires_at);
  if (now > expiresAt) {
    global.pendingPurchases.delete(payment_ref);
    console.log('❌ Payment expired:', payment_ref);
    res.status(400).json({
      success: false,
      status: 'EXPIRED',
      message: 'Payment session has expired'
    });
    return;
  }

  // สำหรับการทดสอบ: จำลองการชำระเงินสำเร็จหลัง 30 วินาที
  const createdAt = new Date(purchase.created_at);
  const timeSinceCreation = now - createdAt;
  const shouldCompleteDemoPayment = timeSinceCreation > 30000; // 30 วินาที

  if (shouldCompleteDemoPayment && purchase.status === 'PENDING') {
    // จำลองการชำระเงินสำเร็จ
    purchase.status = 'PAID';
    purchase.paid_at = new Date().toISOString();
    
    // ย้ายไปยัง completed purchases
    global.completedPurchases.set(payment_ref, purchase);
    
    // เปิดใช้งาน license
    if (!global.activeLicenses) {
      global.activeLicenses = new Map();
    }
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    global.activeLicenses.set(purchase.license_key, {
      license_key: purchase.license_key,
      machine_id: purchase.machine_id,
      customer_email: purchase.customer_email,
      license_type: 'MONTHLY',
      activated_at: purchase.paid_at,
      expires_at: nextMonth.toISOString(),
      status: 'ACTIVE'
    });
    
    console.log(`✅ Payment completed (DEMO): ${payment_ref} | License activated: ${purchase.license_key}`);
    
    res.status(200).json({
      success: true,
      status: 'PAID',
      message: 'Payment completed successfully',
      license_key: purchase.license_key,
      paid_at: purchase.paid_at
    });
    return;
  }

  // ยังคงรอชำระ
  console.log(`⏳ Payment still pending: ${payment_ref} (${Math.round(timeSinceCreation/1000)}s elapsed)`);
  
  res.status(200).json({
    success: true,
    status: 'PENDING',
    message: 'Payment is still pending',
    time_elapsed: Math.round(timeSinceCreation / 1000),
    expires_in: Math.round((expiresAt - now) / 1000)
  });
} 