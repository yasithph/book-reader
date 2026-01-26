/**
 * Email service exports
 */

export {
  sendEmail,
  isValidEmail,
  formatEmail,
  EmailError,
  type SendEmailRequest,
  type SendEmailResponse,
  type EmailErrorCode,
} from "./client";

export {
  generateOTPCode,
  generateOTPEmailHTML,
  generateOTPEmailText,
  sendOTPEmail,
} from "./otp";
