interface OTPData {
  code: string;
  expiresAt: Date;
}

export const generateOTP = (): { otp: string; expiresAt: Date } => {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiration to 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  return { otp, expiresAt };
};

export const verifyOTP = (inputOTP: string, storedOTP?: OTPData): boolean => {
  if (!storedOTP || !storedOTP.code || !storedOTP.expiresAt) {
    return false;
  }

  // Check if OTP has expired
  if (new Date() > new Date(storedOTP.expiresAt)) {
    return false;
  }

  // Compare OTP codes
  return inputOTP === storedOTP.code;
}; 