# Nuvra Wallet — Browser Extension

Nuvra is a chain-agnostic Bitcoin wallet: one wallet that works across BTC
chains instead of being tied to a single network. It starts with **BOB**
(mainnet, chain ID 60808) because BOB is live today, keeps **Bitcoin L1** as
the base layer, and adds **Arch** later — when Arch is officially live with
user funds. Arch is listed in the app as "coming soon" and sending on Arch is
disabled until then.

This repo is the browser extension (Manifest V3 popup), built from Desmond's
original Nuvra extension design: dark background `#0d0d14`, orange `#ff7a2f`,
Syne + DM Sans, and the popup flow
onboarding → signup → PIN → home / send / swap / bridge / discover / activity.

## ⚠️ Demo build — no real funds

**Everything in this phase is mock.** Balances, history, addresses and prices
are demo data (the Home screen is tagged "Demo data"). There are **no real
private keys, no seed phrases, and no signing of real transactions** anywhere
in this codebase. Do not enter a real seed phrase into this build.

## Run it

```bash
npm install
npm test          # chain registry + address validation tests (node --test)
npm run build     # production build into dist/
```

Load it in Chrome:

1. Run `npm run build` (or use the `dist/` from the release zip).
2. Open `chrome://extensions` and enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `dist/` folder.
4. Pin "Nuvra Wallet" and click it to open the popup.

For UI development without Chrome, `npm run dev` serves the same popup in a
regular browser tab (chain selection then persists via localStorage instead
of `chrome.storage.local`).

## Architecture

```
UI screens (src/screens/)
  └─ never call a chain SDK directly
Wallet core (src/wallet/WalletContext.jsx)
  └─ selected chain, per-chain mock accounts, persistence
Chain adapters (src/chains/adapter.js)
  └─ one interface per chain: getAddress, validateAddress,
     getBalances, getHistory, estimateFee, explorerUrl, send
Chain registry (src/chains/registry.js)
  └─ CHAINS: bitcoin (live) · bob 60808 (live) · bob-sepolia 808813
     (testnet) · arch (coming-soon, disabled)
Mock data (src/data/constants.js)
  └─ every asset / transaction / project tagged with a chain id;
     Arch rows are filtered out of default views
```

Key behaviours in this phase:

- **Chain selector** on Home (All chains / Bitcoin / BOB / Arch·Soon) and in
  Settings → Active Networks, both driven by the registry.
- **Receive** shows the selected chain's own address format and confirmation
  language (e.g. "Bitcoin confirmation" vs "Arch finality — not a Bitcoin
  confirmation"), and copies via the clipboard with a fallback.
- **Send** validates the recipient with the selected chain's adapter and
  explains a wrong-chain paste (e.g. a `0x…` address while Bitcoin is
  selected).
- **Discover** filters projects by chain; all entries are labelled demo
  entries — no invented TVLs, no claimed integrations.
- **Swap** defaults to BTC → USDC on BOB; there is no BTC→ARCH default pair.

## Extension plumbing

- `public/manifest.json` — MV3, name "Nuvra Wallet", version 0.1.0, popup +
  icons, and a single permission: `storage` (used only to remember the
  selected chain). No `host_permissions`.
- `public/background.js` — a service-worker stub wired in the manifest. It
  does nothing yet; it exists so the wiring is ready for the provider phase.
- **No dapp provider is injected in this phase.** There is deliberately no
  `window.bitcoin` / `window.ethereum` injection and no content script.

## Next steps

1. **Phase 1 — read-only live data:** real balances/history for BOB Sepolia
   (808813) and Bitcoin testnet behind the same adapter interface, replacing
   the mock adapters chain by chain.
2. **Secure key storage design:** seed generation/storage and signing must be
   designed and reviewed before any real-funds phase; nothing ships on UI
   confidence alone.
3. **BOB mainnet + Gateway:** signing/sending on Bitcoin L1 and BOB mainnet,
   with BOB Gateway for native BTC deposits and swaps.
4. **Dapp provider:** `window.bitcoin` / EVM provider injection via a content
   script, with per-site permissions.
5. **Arch switch-on:** flip the Arch registry entry from `coming-soon` to
   `live` and implement its adapter — no UI rewrite needed.
