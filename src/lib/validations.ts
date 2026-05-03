import { z } from "zod";

// Booking validation
export const bookingSchema = z.object({
  student_name: z.string().min(2, "Name must be at least 2 characters"),
  student_email: z.string().email("Invalid email address"),
  student_phone: z.string().min(10, "Phone number must be at least 10 digits"),
  scheduled_class_id: z.string().uuid("Invalid class ID"),
  payment_method: z.enum(["cash", "card", "bank_transfer", "stripe"]),
  total_amount: z.number().min(0, "Amount must be positive"),
});

// Course template validation
export const courseTemplateSchema = z.object({
  name: z.string().min(3, "Course name must be at least 3 characters"),
  code: z.string().min(2, "Course code is required"),
  price_full: z.number().min(0, "Price must be positive"),
  price_deposit: z.number().min(0, "Deposit must be positive").optional(),
  duration_hours: z.number().min(0.5, "Duration must be at least 0.5 hours"),
  description: z.string().optional(),
});

// User creation validation
export const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  role: z.enum(["student", "trainer", "admin", "receptionist", "super_admin"]),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

// Enquiry validation
export const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  preferred_contact: z.enum(["email", "phone", "sms"]).optional(),
});

// Payment validation
export const paymentSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  payment_method: z.enum(["cash", "card", "bank_transfer", "stripe"]),
  notes: z.string().optional(),
});

// Signature request validation
export const signatureRequestSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  document_type: z.string().min(1, "Document type is required"),
  recipient_name: z.string().min(2, "Recipient name is required"),
  recipient_email: z.string().email("Invalid email address"),
  expires_in_days: z.number().min(1).max(90).optional(),
});

// Settings validation
export const settingsSchema = z.object({
  organization_name: z.string().min(2, "Organization name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().length(3, "Currency must be 3 letters (e.g., AUD)"),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type CourseTemplateInput = z.infer<typeof courseTemplateSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type SignatureRequestInput = z.infer<typeof signatureRequestSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;