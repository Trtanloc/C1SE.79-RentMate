# Email Delivery Configuration

RentMate uses the lightweight `MailerService` in `rentmate-backend/src/mail/mailer.service.ts` to send transactional emails (verification codes, notifications, etc.) via SMTP. A 535 `Invalid login` error from Nodemailer means the SMTP provider rejected the credentials. The most common cause is trying to log in to Gmail with a normal account password, which Google now blocks for security reasons. Follow the instructions below to configure a working SMTP credential.

## Gmail (recommended for quick start)

Google requires an **App Password** when authenticating via SMTP:

1. Enable 2-Step Verification on the Gmail / Google Workspace account.
2. Visit <https://myaccount.google.com/apppasswords>.
3. Create a new App Password (pick "Mail" → "Other" and name it `RentMate`).
4. Google will show a 16-character code. Copy it without spaces.
5. Update your backend `.env`:

   ```env
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_SECURE=false
   MAIL_USER=your-account@gmail.com
   MAIL_PASS=abcdefghijklmnop  # 16-character App Password
   MAIL_FROM="RentMate <your-account@gmail.com>"
   ```

6. Restart the NestJS server so the new variables are loaded.

> **Note:** Attempting to use the normal Gmail password will continue to fail with `EAUTH 535` even if the username is correct.

## Mailtrap (safe for development/testing)

If you do not want to send real emails while developing, create a free Mailtrap inbox and copy the SMTP credentials:

```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_SECURE=false
MAIL_USER=mailtrap-username
MAIL_PASS=mailtrap-password
MAIL_FROM="RentMate <noreply@rentmate.local>"
```

No extra configuration changes are required—just restart the backend after editing `.env`.

## Troubleshooting Checklist

- Confirm both `MAIL_USER` and `MAIL_PASS` are set and match the provider credentials.
- For Gmail, double-check that the App Password is exactly 16 alphanumeric characters (no spaces).
- Ensure outbound connections to the configured `MAIL_HOST:MAIL_PORT` are allowed by your firewall or hosting provider.
- Check the backend logs: if you see the warning *"Gmail SMTP detected but MAIL_PASS is not a 16-character App Password"* the service is still using a regular password.
- After updating environment variables, restart the NestJS server (`npm run start:dev`) so the transporter is recreated with the new credentials.

Following these steps should eliminate the 535 invalid login errors and restore email delivery.

