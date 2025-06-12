
'use server';

import Stripe from 'stripe';

// Initialize Stripe with your secret key.
// Ensure process.env.STRIPE_SECRET_KEY is set in your environment.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use the latest API version
  typescript: true,
});

export interface CreatePaymentIntentResponse {
  clientSecret: string | null;
  error?: string;
}

export async function createPaymentIntent(
  amount: number // Amount in the smallest currency unit (e.g., paise for INR)
): Promise<CreatePaymentIntentResponse> {
  if (typeof amount !== 'number' || amount <= 0) {
    return { clientSecret: null, error: "Invalid amount" };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'inr', // UPI requires INR
      automatic_payment_methods: {
        enabled: true, // Stripe will automatically enable compatible payment methods like UPI
      },
    });
    return { clientSecret: paymentIntent.client_secret };
  } catch (error: any) {
    console.error('Error creating PaymentIntent:', error);
    // Return a generic error message to the client for security
    return { clientSecret: null, error: "Could not initiate payment. Please try again." };
  }
}

