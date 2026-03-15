export const EMAIL_KEYS = {
  SERVICE_ID:        "service_z5vr2hr345",
  TEMPLATE_ID:       "template_x5qjdb7t6",
  GUEST_TEMPLATE_ID: "template_0sgecbx",
  PUBLIC_KEY:        "Sr8ne3azvu5WL5xCk",
};

// TEMPORARY DEBUG
console.log("EMAIL KEYS AT RUNTIME:", {
  hasServiceId:  !!process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  hasTemplateId: !!process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  hasGuestId:    !!process.env.NEXT_PUBLIC_EMAILJS_GUEST_TEMPLATE_ID,
  hasPublicKey:  !!process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
  publicKeyLength: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.length ?? 0,
});
