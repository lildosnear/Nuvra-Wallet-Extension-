# Nuvra Backend

Accounts, email verification, passkeys, sessions, and split seed
share coordination for Nuvra Wallet, built to the split seed plan
(`nuvra-split-seed-plan.md` in the wallet goal files).

## The non-custodial contract

This server stores:

- user accounts (email, an Argon2id password hash for login),
- passkey public credentials,
- the account share, encrypted by the client under the user
  password. Opaque here; the server cannot decrypt it,
- one Shamir share (the Nuvra share). One share is below the two
  of three threshold and reveals nothing on its own,
- public wallet addresses.

It never receives the device share, a seed, or a private key, so
it can never rebuild a wallet or sign a transaction. The Nuvra
share is released only to a session carrying BOTH a fresh passkey
verification (under 5 minutes old) and a fresh email verification
(under 10 minutes old). Every release, denial, and rotation is
written to the audit log.

## Run it

The backend lives in this `backend/` folder of the wallet repo,
with its own package and dependencies, separate from the
extension at the repo root.

```bash
cd backend
npm install
npm start          # http://localhost:8787
npm test           # full API suite, incl. real WebAuthn flows
```

Environment:

- `PORT` (default 8787)
- `NUVRA_STORE_FILE` — optional JSON file for store persistence.
  Without it the store is in memory. The store sits behind one
  module (`src/store.js`) with spec shaped tables, so PostgreSQL
  is a storage swap later.
- `NUVRA_RP_ID` — WebAuthn relying party id (default `localhost`).
- `NUVRA_ORIGINS` — comma separated expected WebAuthn origins
  (default `http://localhost:8787`). For the extension, set this
  to the extension origin.

## Email

`src/mailer.js` is an interface. The dev transport records codes
in an outbox and logs them; it does not send real mail. Wire a
real provider (SES, Resend, SMTP) behind the same shape before
any public use.

## API (base `/api/v1`)

Accounts: `POST /auth/register`, `POST /auth/verify-email`,
`POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`,
`POST /auth/email-code`, `POST /auth/email-code/verify`.

Passkeys: `POST /auth/passkey/register/options`,
`POST /auth/passkey/register/verify`,
`POST /auth/passkey/login/options`,
`POST /auth/passkey/login/verify`,
`POST /auth/passkey/verify/options`, `POST /auth/passkey/verify`
(step up inside a session).

Wallets: `POST /wallets` (create, once per account),
`GET /wallets/mine` (metadata only, never shares),
`POST /wallets/shares/account`,
`POST /wallets/shares/nuvra/release` (the gated release),
`PUT /wallets/shares` (rotation, needs a fresh passkey proof).

## Status

Slice 1, November 2026: the API and the client side wallet core
(in this repo, `src/wallet/shamir.js` and
`src/wallet/vault2.js` at the root) are built and tested end to end against
each other. Not yet done: the extension screens still run the
device vault until the UI wiring slice lands; real email
delivery; production database; rate limiting beyond code attempt
caps.
