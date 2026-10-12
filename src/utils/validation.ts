import { z } from 'zod';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Zod helpers whose error messages are i18n keys (optionally "key|count").
 * Render with the `useErrorText()` hook:
 *
 *   const schema = z.object({ email: zEmail(), name: zRequired() });
 *   const err = useErrorText();
 *   <Input error={err(errors.email?.message)} ... />
 */

export const MSG = {
  required: 'common:validation.required',
  email: 'common:validation.email',
  phone: 'common:validation.phone',
  consent: 'common:validation.consent',
  passwordMatch: 'common:validation.passwordMatch',
  rating: 'common:validation.rating',
  minLength: (n: number) => `common:validation.minLength|${n}`,
  maxLength: (n: number) => `common:validation.maxLength|${n}`,
};

export const zRequired = (max = 200) => z.string().trim().min(1, MSG.required).max(max, MSG.maxLength(max));

export const zOptional = (max = 200) => z.string().trim().max(max, MSG.maxLength(max)).optional().or(z.literal(''));

export const zEmail = () => z.string().trim().min(1, MSG.required).email(MSG.email);

export const zPhone = () =>
  z
    .string()
    .trim()
    .min(1, MSG.required)
    .regex(/^\+?[\d\s().-]{7,20}$/, MSG.phone);

export const zMinLength = (n: number, max = 128) =>
  z.string().min(n, MSG.minLength(n)).max(max, MSG.maxLength(max));

export const zConsent = () => z.boolean().refine((v) => v === true, MSG.consent);

export function useErrorText() {
  const { t } = useTranslation();
  return useCallback(
    (message?: string) => {
      if (!message) return undefined;
      const [key, count] = message.split('|');
      return String(count ? t(key, { count: Number(count) }) : t(key));
    },
    [t],
  );
}
