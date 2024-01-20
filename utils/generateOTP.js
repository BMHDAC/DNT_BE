export const generateOTP = () => {
  const otpLength = 6 // Độ dài của OTP
  const min = Math.pow(10, otpLength - 1) // Giá trị nhỏ nhất có otpLength chữ số
  const max = Math.pow(10, otpLength) - 1 // Giá trị lớn nhất có otpLength chữ số
  const otp = Math.floor(Math.random() * (max - min + 1)) + min
  return otp.toString()
}
