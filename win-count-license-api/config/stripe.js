// Stripe Configuration
export const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key_here',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key_here',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here'
};

// Stripe Product Configuration
export const STRIPE_PRODUCTS = {
  monthly_license: {
    name: 'Win Count Monthly License',
    description: 'Monthly subscription for Win Count by ArtYWoof',
    price: 149, // THB
    currency: 'thb',
    interval: 'month'
  }
};

// Payment Configuration
export const PAYMENT_CONFIG = {
  currency: 'thb',
  payment_methods: ['card', 'promptpay'],
  success_url: 'https://win-count-by-artywoof-miy1mgiyx-artywoofs-projects.vercel.app/success',
  cancel_url: 'https://win-count-by-artywoof-miy1mgiyx-artywoofs-projects.vercel.app/cancel'
}; 