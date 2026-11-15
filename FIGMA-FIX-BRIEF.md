# Nuvra Extension — Figma Fidelity Fix Brief (15 Nov 2026)

Repo: ~/workspace/nuvra-extension (Vite + React 18 + Tailwind, MV3 popup 375x600 / 400x680 wide).
Design source: Figma "NUVRA Wallet (Copy)" file Y1aWqzwGfTJuVkVCkzkKPM, frames 430x932, read directly off the canvas twice (Oct 1 guide + Nov 15 detailed read). Specs below are the canvas facts. Apply them screen by screen. Keep ALL working logic: chain registry/adapters/WalletContext, address validation, flows, mock data labelling. Do not invent artwork; use existing PNG assets. Do not rename the project or mention any other project.

## Design system (applies everywhere)
- Background #101010 (near-black). Cards #101010 to #1F1F1F fills on that bg use #1A1A1A/#1F1F1F to stay visible, radius 16.
- Text white; secondary text #959595.
- Primary gradient: linear-gradient(135deg, #F0834A, #EC641D). Primary buttons: full-width pill, height 54-56, white bold 15px text, glow shadow 0 8px 24px rgba(236,100,29,0.35).
- Disabled primary button: same pill in muted brown #5E280C with dark text (#1a0f08 / rgba(0,0,0,0.55)).
- App screens use DM Sans throughout (bold for titles). The serif face exists only in the onboarding carousel — do NOT change onboarding headline font (unconfirmed); remove Syne from all in-app screens (headers, balances, titles).
- Standard header (Home has no title; Send/Swap/Bridge/Activity do): Nuvra mark left ~32px, screen title centred white bold ~15px, bell icon + circular avatar ~36px right.
- Bottom nav: 5 tabs Home/Swap/Bridge/Discover/Activity, labels ~10px under icons; active = orange #EC641D icon+label, inactive = grey #959595; NO pill background, NO dot.
- Sheets/modals: black bg, white circle close button (36px, white fill, black X) top-right.

## Desmond overrides (beat the Figma where they conflict)
- Copy is chain-agnostic: never write "Arch Network ecosystem", "solana" or "recevice" anywhere. Banner text: "The Bitcoin-aligned gateway to the Bitcoin ecosystem." Receive sub-copy pattern: "Use <selected chain display name> to receive tokens to your wallet".
- Send success headline: "Successful Send Token" (Figma frame is mislabelled "Successful Swap Token" — do not copy).
- Send confirmation slider label: "Slide to send" (Figma sheet says "Slide to swap" — designer error).
- ARCH token is not launched and Arch is coming-soon: keep the chain registry behaviour (Arch disabled with SOON badge). Figma's demo rows (BTC/ARCH/ETH with balances) are design demo data; the app's per-chain mock assets stay as they are, only their presentation changes to the Figma row format.

## Per-screen fixes

### Home
- "Total Balance" grey 12px centred; balance amount ~38px DM Sans bold white centred (currently Syne, check alignment).
- 4 action circles ~56px, fill #1F1F1F, labels Send/Receive/Swap/Buy ~11px below.
- Promo banner: dark card r16, text left (headline white 13px + "Explore and earn" grey below), coin art right, X close top-right. If public/images/banner_ad.png has text baked in, do NOT use it; compose the card from text + existing coin PNGs (nuvra_coin / token icons). If it is pure art with no baked words, it may stay.
- "Your Assets" 18px bold left. Asset rows: dark cards ~72px high r16; 40px token disc left; symbol bold 14 white + network grey 11 below; right amount bold 14 + fiat grey 11. (Presentation only; data unchanged.)
- Keep the chain selector (product feature, not in Figma) but restyle as a small dark pill under the header so it blends with the design. Keep the DEMO DATA tag.

### Receive modal
- White circle X (36px) top-right. Title "Top-up Wallet" centred, 18px bold.
- QR block: dark rounded square ~200-220px, radius ~32, existing QR drawing with logo centre is fine.
- "Scan code" small black pill (~90x28) under QR.
- "Your Wallet Address" 18px bold; sub-copy per Desmond pattern above, grey 12px centred.
- Address pill: dark pill, token icon + truncated address + copy icon right.
- Below: share icon and copy icon in dark circles, with "Copy address" white 13px text (keep existing copy/share behaviour).
- Bottom: "Powered by" small grey + Nuvra mark.

### PIN (PinScreen AND PinModal)
- Dots: empty = solid WHITE fill; entered = orange #EC641D. (Currently empty dots are translucent — fix.)
- REMOVE the fingerprint/biometric button entirely (not in Figma).
- Keypad: plain numerals ~28px, thin weight, NO key backgrounds; bottom row ".", "0", backspace.
- "Enter Pin code" 20px bold; padlock image ~100-110px; logo top-left; "Back" dark pill (#1F1F1F, grey text, ~64x32).
- PinModal must become a FULL-SCREEN overlay (absolute inset 0, bg #101010, zIndex above sheets) with this same layout — Figma uses the full-screen PIN, not a bottom sheet.

### Send
- Header title "Send Tokens"; "Back" dark pill below-left.
- Address field: #1F1F1F, r16, ~56px high, placeholder "Paste address or scan QR", QR-scan icon right. Keep wrong-chain validation errors.
- Amount card: dark r16 ~110px; top row "Enter Amount" grey left + "Balance: <bal> <SYM>" grey right; big amount ~32px bold; token selector = BLACK pill (disc + symbol + chevron) bottom-right of the card.
- NO recents/saved-address list (remove if present).
- Send button: disabled brown / enabled gradient pill.
- Review sheet: title "Send Token"; white circle X; token disc 56px; symbol bold 20; "<amount> <SYM> ~ <fiat>" grey 13; address pill (QR icon + masked address); rows: "Send <SYM>" white left, right token icon + "= <amount>"; "Est. Fee:" grey with info glyph, right fee in white (keep existing mock fee value/format); SlideButton labelled "Slide to send".
- Success screen: title "Successful Send Token"; token disc 56; symbol bold 18; "<amount> <SYM> ~ <fiat>" grey; small grey "to"; address pill (QR icon + masked address); orange gradient "Done" pill; below, two circular black buttons ~48px with labels under: "View Transaction" and "Share". No bottom nav on success.

### Swap
- Cards labelled "Pay" (top-right "Balance: ...") and "Receive" (top-right "Est. Fee: $1.20" — keep existing mock fee string if present, else $1.20).
- Big amounts ~28px bold bottom-left of each card; token selector black pill bottom-right.
- Flip button: orange GRADIENT circle ~40px, white up/down arrows, overlapping between cards.
- Rows under cards: "Rate" + info glyph left, rate value right; "Price impact" left, "< 0.01%" right.
- Swap button disabled brown / enabled gradient.
- Select Token sheet: title "Select Token" left, white circle X; rows in Home-asset format (40px disc, name bold + network grey, balance + fiat right) from the current chain's assets.
- Review sheet: title "Swap Token"; overlapping from/to discs centre; "<FROM> to <TO>" bold; "1 <FROM> = <rate> <TO>" grey; rows "Swap <FROM>" / icon "= <amount>", "Get <TO>" / icon "= <amount>", "Est. Fee:" / fee; SlideButton "Slide to swap".
- Success: title "Successful Swap Token"; overlapping discs with small black swap badge between; "<FROM> to <TO>" bold 18; "1 <FROM> ~ <rate> <TO>" grey; "Done" gradient pill near bottom; no bottom nav.

### Bridge
- RESTRUCTURE top: pair selector row — black pill (from disc + symbol + chevron) | orange gradient circle with white horizontal-arrows icon | black pill (to). 
- Big amount "$0.0" format centred ~36px bold (keep existing amount state; display with $ prefix as Figma does).
- Row: "Balance: <bal> <SYM>" grey left; "<amount> <SYM>" grey right.
- From/To cards SIDE BY SIDE: dark r16 ~56px+, each token icon + label ("From"/"To") + amount "0.00" grey.
- Numeric keypad: same plain-numeral style as PIN.
- Button: "Bridge <FROM> to <TO>", disabled brown until valid.
- Select Token sheet: same as Swap's.
- Success: reuse the Swap success layout (discs, pair, rate/amount line, Done), title "Successful Bridge".

### Activity
- Search pill #1F1F1F ~48px, placeholder "Search...", magnifier left; orange GRADIENT circle button ~48px with white filter/sliders icon right of it.
- Filter chips: ONLY All / Bridge / Swap / Send. "All" = orange gradient pill white text; others black pills with small icon + label. (Remove the Receive chip.)
- Rows: dark cards ~64px r16; left 40px black circle with type icon; title bold 13 + date grey 11; right: coin icon + signed amount bold, status pill below (~24px): Completed = green text on dark-green fill; Pending = amber text on dark-amber fill; Failed = red text on dark-red fill.
- Empty state copy: "No activity yet" (grey, centred). No illustration (no asset exists).

### Discover
- Header: Nuvra mark ~40px left; dark search pill "Search or type URL" with a menu (≡) icon at its right inside the pill; black square button with "1" at far right. NO bell, NO avatar on this screen.
- Promo banner: same component as Home.
- Heading "Discover >" 18px bold (text includes the chevron).
- Filter row: "All" = orange gradient pill; "Wallet" / "Social" / "DeFi" = plain grey text, NO pill backgrounds.
- Project rows: dark cards ~64px; 48px rounded-square icons; name bold 14; description grey 11 truncated with ellipsis. Remove verified badges, tag chips and "Explore" buttons from the rows. Keep the project detail sheet on click, restyled to these tokens.
- Keep per-chain availability behaviour; presentation follows Figma.

### Settings
- Title "Settings" 20px bold left; white circle X top-right (sheet context).
- Avatar ~110px circle centred with small dark pencil/edit badge bottom-right; greeting "Hi, Danii 👋" 18px centred under it.
- ONE dark menu card r20 containing all rows (~56px each, thin dividers, grouped): black circle icon ~44px left, label 15px white, grey chevron right. Order: Manage Account; Preferences; Active Networks; Connected Apps; Recovery Phrase; About Nuvra; Log out (icon circle dark red, red icon, label stays white).
- REMOVE the app-version row/text.
- Keep all existing sub-views and the networks panel reachable from the rows. settings_apps.png and settings_logout.png are still missing files — keep whatever current fallback the code already uses for those two rows; do not invent new artwork.

### Sign-up / Referral (from the October guide)
- Placeholders exactly: "e.g danieljames@gmail.com", "8-16 Character", "8-16 Character".
- "I already have a wallet" on sign-up = dark button with subtle border (like onboarding's black button), not a text link.
- Add cookie notice "Do not sell or share my personal info" (small, muted, bottom).
- Referral: placeholder "Enter Referral code"; "Skip" as a dark button; referral illustration ~200x180 contain.

## Verify before reporting done
- npm test passes (17/17), npm run build passes.
- Grep: no "ff7a2f", no "Arch Network ecosystem", no "solana"/"recevice" in src; Syne only in OnboardingScreen (and global font import may remain).
- Report per screen: what changed, in plain words, plus anything from this brief you could NOT do and why.
