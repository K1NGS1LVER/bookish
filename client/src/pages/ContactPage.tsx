import { useState, type FormEvent } from "react";
import { CircleAlert, Clock, Mail, MapPin } from "lucide-react";
import { validateField } from "shared";
import { FormField } from "../components/checkout/FormField";
import { Button } from "../components/ui/Button";
import { useHead } from "../hooks";
import styles from "./ContactPage.module.css";

interface ContactFields {
  name: string;
  email: string;
  message: string;
}

const EMPTY: ContactFields = { name: "", email: "", message: "" };

function messageError(value: string): string | null {
  if (!value.trim()) return "Message is required";
  if (value.trim().length < 10) return "Say a little more — at least 10 characters";
  return null;
}

export function ContactPage() {
  const [fields, setFields] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<ContactFields>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactFields, boolean>>>({});
  const [sent, setSent] = useState(false);

  useHead({
    title: "Contact — Bookish.",
    description: "Get in touch with the Bookish team.",
  });

  function fieldError(field: keyof ContactFields, value: string) {
    return field === "message" ? messageError(value) : validateField(field, value);
  }

  function setField(field: keyof ContactFields, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    if (touched[field]) {
      setErrors((e) => ({ ...e, [field]: fieldError(field, value) ?? undefined }));
    }
  }

  function onBlur(field: keyof ContactFields) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: fieldError(field, fields[field]) ?? undefined }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Partial<ContactFields> = {};
    (Object.keys(fields) as (keyof ContactFields)[]).forEach((field) => {
      const err = fieldError(field, fields[field]);
      if (err) nextErrors[field] = err;
    });
    setTouched({ name: true, email: true, message: true });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSent(true);
  }

  if (sent) {
    return (
      <div className={styles.page}>
        <div className={styles.sentState}>
          <h1 className={styles.sentTitle}>Message sent.</h1>
          <p>Thanks for writing in — we read every note and reply within a couple of days.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Get in touch.</h1>
        <p className={styles.lede}>
          Questions about an order, a genre suggestion, or just want to talk
          about a book? We'd like to hear it.
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <Mail aria-hidden="true" size={18} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>Email</p>
              <p className={styles.infoText}>hello@bookish.example</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <Clock aria-hidden="true" size={18} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>Response time</p>
              <p className={styles.infoText}>Within 2 business days</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <MapPin aria-hidden="true" size={18} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>Based in</p>
              <p className={styles.infoText}>Online only — no storefront (yet)</p>
            </div>
          </div>
        </div>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <FormField
            id="contact-name"
            label="Name"
            value={fields.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => onBlur("name")}
            error={errors.name}
          />
          <FormField
            id="contact-email"
            label="Email"
            type="email"
            value={fields.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => onBlur("email")}
            error={errors.email}
          />
          <div className={styles.field}>
            <label className={styles.label} htmlFor="contact-message">
              Message
            </label>
            <textarea
              id="contact-message"
              className={styles.textarea}
              value={fields.message}
              onChange={(e) => setField("message", e.target.value)}
              onBlur={() => onBlur("message")}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={errors.message ? "contact-message-error" : undefined}
              data-error={errors.message ? true : undefined}
            />
            {errors.message && (
              <p id="contact-message-error" className={styles.error}>
                <CircleAlert aria-hidden="true" size={13} />
                {errors.message}
              </p>
            )}
          </div>
          <Button type="submit">Send message</Button>
        </form>
      </div>
    </div>
  );
}
