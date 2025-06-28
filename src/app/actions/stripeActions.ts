
'use server';

import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';

// Initialize Razorpay with your key and secret.
// Ensure these are set in your environment variables.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface CreateRazorpayOrderResponse {
  orderId?: string;
  error?: string;
}

export async function createRazorpayOrder(
  amount: number // Amount in the smallest currency unit (e.g., paise for INR)
): Promise<CreateRazorpayOrderResponse> {
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
