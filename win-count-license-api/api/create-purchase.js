// api/create-purchase.js - แก้ไข CORS อย่างสมบูรณ์
const generateCRC16 = (data) => {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

const generatePromptPayQR = (phoneNumber, amount, reference) => {
  const cleanPhone = phoneNumber.replace(/^0/, '+66');
  
  const buildTag = (tag, value) => {
    const length = value.length.toString().padStart(2, '0');
    return tag + length + value;
  };

  let qrData = '';
  qrData += buildTag('00', '01');
  qrData += buildTag('01', '12');
  
  let merchantInfo = '';
  merchantInfo += buildTag('00', 'A000000677010112');
  merchantInfo += buildTag('01', cleanPhone);
  merchantInfo += buildTag('02', reference);
  
  qrData += buildTag('29', merchantInfo);
  qrData += buildTag('52', '0000');
  qrData += buildTag('53', '764');
  qrData += buildTag('54', amount.toFixed(2));
  qrData += buildTag('58', 'TH');
  qrData += buildTag('59', 'Win Count by ArtYWoof');
  qrData += buildTag('60', 'Bangkok');
  
  const dataWithoutCRC = qrData + '6304';
  const crc = generateCRC16(dataWithoutCRC);
  qrData += '6304' + crc;
  
  return qrData;
};

export default async function handler(req, res) {
  // CORS Headers - ต้องเซตก่อนทุกอย่าง
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled successfully');
    res.status(200).end();
    return;
  }

  // Log ข้อมูล request
  console.log('📡 Incoming request:', {
    method: req.method,
    headers: req.headers,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
    return;
  }

  const { machine_id, customer_email } = req.body || {};
  
  console.log('📨 Request body:', { 
    machine_id: machine_id ? '✓' : '✗', 
    customer_email: customer_email ? '✓' : '✗' 
  });
  
  if (!machine_id || !customer_email) {
    console.log('❌ Missing required fields');
    res.status(400).json({
      success: false,
      message: 'Missing required fields (machine_id, customer_email)',
      received: { machine_id: !!machine_id, customer_email: !!customer_email }
    });
    return;
  }

  try {
    console.log('🔄 Processing payment creation...');
    
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
      console.log('📦 Initialized global.pendingPurchases');
    }
    
    // Store pending purchase
    global.pendingPurchases.set(paymentRef, {
      license_key: licenseKey,
      machine_id: machine_id,
      customer_email: customer_email,
      amount: 149,
      currency: 'THB',
      status: 'PENDING',
      created_at: new Date().toISOString(),
      expires_at: expiresAt
    });
    
    console.log(`💾 Stored pending purchase: ${paymentRef}`);
    
    // PromptPay setup
    const promptPayPhone = '0909783454';
    const amount = 149;
    
    // Generate PromptPay QR Data
    const promptPayQRData = generatePromptPayQR(promptPayPhone, amount, paymentRef);
    
    // QR Code URLs - ใช้ขนาดใหญ่ขึ้นและ service ที่เสถียรกว่า
    const qrCodeServices = [
      `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(promptPayQRData)}&margin=2`,
      `https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=${encodeURIComponent(promptPayQRData)}&chld=M|2`,
      `https://quickchart.io/qr?text=${encodeURIComponent(promptPayQRData)}&size=400&format=png&margin=2`
    ];
    
    const response = {
      success: true,
      payment_ref: paymentRef,
      license_key: licenseKey,
      qr_code_data: qrCodeServices[0],
      qr_code_fallbacks: qrCodeServices,
      promptpay_data: promptPayQRData,
      amount: amount,
      currency: 'THB',
      expires_at: expiresAt,
      promptpay_info: {
        phone: promptPayPhone,
        amount: amount,
        reference: paymentRef
      },
      instructions: {
        th: `สแกน QR Code เพื่อจ่ายเงิน ${amount} บาท ผ่าน PromptPay`,
        en: `Scan QR Code to pay ${amount} THB via PromptPay`
      },
      server_time: new Date().toISOString(),
      debug_info: {
        total_pending: global.pendingPurchases.size,
        qr_data_length: promptPayQRData.length,
        qr_data_sample: promptPayQRData.substring(0, 100) + '...',
        phone_number: promptPayPhone,
        amount: amount,
        reference: paymentRef
      }
    };
    
    console.log('✅ Purchase created successfully:', {
      paymentRef,
      licenseKey,
      amount,
      qrDataLength: promptPayQRData.length
    });
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ API Error:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
      error_details: error.stack,
      timestamp: new Date().toISOString()
    });
  }
} 