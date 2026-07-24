import type { CheckoutFields } from "./types";

export type CheckoutErrors = Partial<Record<keyof CheckoutFields, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\d{10}$/;
const PIN_RE = /^\d{6}$/;

export function validateField(
  field: keyof CheckoutFields,
  value: string
): string | null {
  const v = value.trim();
  switch (field) {
    case "name":
      if (!v) return "Name is required";
      if (v.length < 2) return "Name must be at least 2 characters";
      return null;
    case "email":
      if (!v) return "Email is required";
      if (!EMAIL_RE.test(v)) return "Enter a valid email address";
      return null;
    case "phone":
      if (!v) return "Phone number is required";
      if (!PHONE_RE.test(v)) return "Phone must be exactly 10 digits";
      return null;
    case "address":
      if (!v) return "Address is required";
      if (v.length < 5) return "Address looks too short";
      return null;
    case "city":
      if (!v) return "City is required";
      return null;
    case "state":
      if (!v) return "State is required";
      return null;
    case "pin":
      if (!v) return "PIN code is required";
      if (!PIN_RE.test(v)) return "PIN must be exactly 6 digits";
      return null;
  }
}

export const CHECKOUT_FIELDS: (keyof CheckoutFields)[] = [
  "name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "pin",
];

export function validateCheckout(fields: CheckoutFields): CheckoutErrors {
  const errors: CheckoutErrors = {};
  for (const field of CHECKOUT_FIELDS) {
    const error = validateField(field, fields[field] ?? "");
    if (error) errors[field] = error;
  }
  return errors;
}
