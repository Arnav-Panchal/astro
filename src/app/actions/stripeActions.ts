
'use server';

import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';

export interface CreateRazorpayOrderResponse {
  orderId?: string;
  error?: string;
}

export async function createRazorpayOrder(
  amount: number // Amount in the smallest currency unit (e.g., paise for INR)
): Promise<CreateRazorpayOrderResponse> {
  // Check for environment variables first
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const errorMessage = 'Razorpay KEY_ID or KEY_SECRET is not set in environment variables on the server.';
    console.error(errorMessage);
    // Return a user-friendly error to be displayed in the UI
    return { error: 'Payment service is not configured. Please contact support.' };
  }

  // Initialize Razorpay inside the function to avoid app crash on startup
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  if (typeof amount !== 'number' || amount <= 0) {
    return { error: 'Invalid amount' };
  }

  const options = {
    amount, // amount in the smallest currency unit
    currency: 'INR',
    receipt: `receipt_order_${randomBytes(4).toString('hex')}`, // a unique receipt ID
  };

  try {
    const order = await razorpay.orders.create(options);
    if (!order) {
      return { error: 'Order creation failed' };
    }
    return { orderId: order.id };
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return { error: 'Could not initiate payment. Please try again.' };
  }
}
