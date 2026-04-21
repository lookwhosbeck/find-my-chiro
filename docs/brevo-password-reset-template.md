# Brevo template — Password reset (Movyn)

This is the template fed by the Supabase Send Email hook for the `recovery`
action. The hook is implemented in
[`app/api/webhooks/supabase-auth-email/route.ts`](../app/api/webhooks/supabase-auth-email/route.ts)
and the helper that posts it lives in
[`app/lib/brevo-transactional.server.ts`](../app/lib/brevo-transactional.server.ts)
(`sendBrevoPasswordResetEmail`).

The transactional template id is read from `BREVO_PASSWORD_RESET_TEMPLATE_ID`
(default `13`).

## Merge params the app sends

| Param | Notes |
|---|---|
| `params.reset_url` | One-time recovery URL built from Supabase's `/auth/v1/verify?token=...&type=recovery&redirect_to=<app>/reset-password`. Lands the user directly on `/reset-password` in the app. |
| `params.FIRSTNAME` | From `auth.users.user_metadata.first_name` (may be empty). |
| `params.LASTNAME` | From `auth.users.user_metadata.last_name` (may be empty). |

> Any merge tag using contact attributes (`{{ contact.* }}`) will be empty when
> we send via API — always read from `params.*`.

## Brevo template settings

- **Template name**: `Movyn — Password reset`
- **Subject**: `Reset your Movyn password`
- **Sender name**: `Movyn`
- **Sender email**: your verified `BREVO_TRANSACTIONAL_SENDER_EMAIL` (e.g. `hello@movynalong.com`)
- **Reply-to**: same as sender
- **Tag**: `auth-recovery`
- **Status**: Active

## HTML content — paste into Brevo "Code your own → HTML" editor

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reset your Movyn password</title>
  </head>
  <body
    style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#202020;"
  >
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:#1d1d1f;padding:24px 32px;text-align:left;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.4px;">Movyn</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <h1 style="margin:0 0 12px 0;font-size:22px;line-height:28px;font-weight:700;color:#202020;letter-spacing:-0.4px;">
                  Reset your password
                </h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:22px;color:#3a3a3f;">
                  Hi{{#if params.FIRSTNAME}} {{ params.FIRSTNAME }}{{/if}},
                </p>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:22px;color:#3a3a3f;">
                  We received a request to reset the password for your Movyn account.
                  Click the button below to choose a new password. The link is valid
                  for a limited time.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#2563eb" style="border-radius:8px;">
                      <a
                        href="{{ params.reset_url }}"
                        style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:-0.2px;"
                      >
                        Reset password
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <p style="margin:0 0 8px 0;font-size:13px;line-height:20px;color:#5b5b60;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin:0;font-size:13px;line-height:20px;word-break:break-all;">
                  <a href="{{ params.reset_url }}" style="color:#2563eb;text-decoration:underline;">
                    {{ params.reset_url }}
                  </a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <p style="margin:0;font-size:13px;line-height:20px;color:#5b5b60;">
                  Didn't request this? You can safely ignore this email — your
                  password won't change unless you click the link above.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;border-top:1px solid #ececef;">
                <p style="margin:0;font-size:12px;line-height:18px;color:#8a8a90;">
                  Movyn helps patients find chiropractors that fit. If you didn't
                  create a Movyn account, please disregard this message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Plain-text version (recommended)

```text
Reset your Movyn password

Hi {{ params.FIRSTNAME }},

We received a request to reset the password for your Movyn account.
Use the link below to choose a new password — it's valid for a limited time.

{{ params.reset_url }}

Didn't request this? You can safely ignore this email; your password
won't change unless you click the link above.

— Movyn
```

## Supabase redirect allow list (required)

Recovery links hand off directly to `/reset-password` on the app origin — **not**
through `/auth/callback` — because Supabase's `/auth/v1/verify?type=recovery`
returns the session in the URL hash fragment, which a server route can't read.

Add every origin that should be able to receive reset links to
**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**:

- `https://movynalong.com/reset-password`
- `https://www.movynalong.com/reset-password` (if you serve www)
- `https://*.vercel.app/reset-password` (preview deployments)
- `http://localhost:3000/reset-password` (local dev)

If the URL the browser arrives at isn't on this list, Supabase silently drops
the tokens and `/reset-password` will report the link as expired/invalid.

## Quick smoke test

1. Set `BREVO_PASSWORD_RESET_TEMPLATE_ID` in `.env.local` and Vercel envs to
   the new template id (or keep it as `13` if you reuse the existing slot).
2. In Supabase **Auth → Hooks**, ensure the **Send Email** hook is enabled and
   points at `https://<your-host>/api/webhooks/supabase-auth-email` with the
   shared secret stored as `SUPABASE_SEND_EMAIL_HOOK_SECRET`.
3. Add the `/reset-password` origins to the Supabase redirect allow list
   (previous section).
4. Hit `/forgot-password` in the app, submit an email that exists in
   `auth.users`, and confirm the email lands with a working link that opens
   `/reset-password` and lets you set a new password.
