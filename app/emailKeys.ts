import emailjs from "@emailjs/browser";

export const EMAIL_KEYS = {
  SERVICE_ID:        "service_z5vr2hr345",
  TEMPLATE_ID:       "template_x5qjdb7t6",
  GUEST_TEMPLATE_ID: "template_0sgecbx",
  PUBLIC_KEY:        "Sr8ne3azvu5WL5xCk",
};

// Initialize EmailJS once when the module loads
emailjs.init({ publicKey: EMAIL_KEYS.PUBLIC_KEY });
