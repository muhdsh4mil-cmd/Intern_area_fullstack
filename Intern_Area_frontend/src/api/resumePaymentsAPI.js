import axiosInstance from "./axiosInstance";

// Step 1: Send OTP to the logged-in candidate's email for verification
export const sendResumeOTP = async () => {
  const { data } = await axiosInstance.post("/payments/resume-otp");
  return data; // { message }
};

// Step 2: Verify the OTP entered by the user
export const verifyResumeOTP = async ({ otp }) => {
  const { data } = await axiosInstance.post("/payments/verify-resume-otp", { otp });
  return data; // { success, message }
};

// Step 3: Create a Razorpay order for ₹50, sending along the resume details to store temporarily
export const createResumeOrder = async ({ resumeData }) => {
  const { data } = await axiosInstance.post("/payments/create-resume-order", { resumeData });
  return data; // { orderId, amount, currency, keyId }
};

// Step 4: Verify the Razorpay checkout signature and generate/link the PDF resume
export const verifyResumePayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const { data } = await axiosInstance.post("/payments/verify-resume-payment", {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  });
  return data; // { success, message, resumeUrl, profileResumeData }
};
