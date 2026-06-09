import axiosInstance from "./axiosInstance";

// Step 1: Create a Razorpay order (returns orderId, amount, keyId)
export const createOrder = async ({ plan }) => {
  const { data } = await axiosInstance.post("/payments/create-order", { plan });
  return data;
};

// Step 2: Verify payment signature after Razorpay checkout succeeds
export const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }) => {
  const { data } = await axiosInstance.post("/payments/verify", {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
  });
  return data;
};
