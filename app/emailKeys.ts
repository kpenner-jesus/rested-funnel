export const EMAIL_KEYS = {
  SERVICE_ID:        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID        ?? "",
  TEMPLATE_ID:       process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID       ?? "",
  GUEST_TEMPLATE_ID: process.env.NEXT_PUBLIC_EMAILJS_GUEST_TEMPLATE_ID ?? "",
  PUBLIC_KEY:        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY        ?? "",
};

// TEMPORARY DEBUG
console.log("EMAIL KEYS AT RUNTIME:", {
  hasServiceId:  !!process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  hasTemplateId: !!process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  hasGuestId:    !!process.env.NEXT_PUBLIC_EMAILJS_GUEST_TEMPLATE_ID,
  hasPublicKey:  !!process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
  publicKeyLength: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.length ?? 0,
});
