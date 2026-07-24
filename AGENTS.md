# AGENTS.md - Minimon Project Reference

## Rabbit R1 Creation Code Generation

To create an authentic R1 creation code QR:

### Method
1. Clone the creations-sdk repo: `git clone https://github.com/rabbit-hmi-oss/creations-sdk.git`
2. Copy `creations-sdk/qr/final/` locally
3. Use the `QRCodeStyling` library (`qr-code-styling@1.6.0-rc.1`) with `canvas` npm package
4. Generate QR encoding a JSON object with these fields:
   - `title` - app name
   - `url` - HTTPS URL where the web app is hosted
   - `description` - short description
   - `iconUrl` - icon URL (can be empty)
   - `themeColor` - hex color like `#FE5000`

### QR Code Styling Settings (from Enhanced QR Code Generator `app.js`)
```javascript
const qrCodeOptions = {
    width: 300, height: 300, type: "canvas",
    data: JSON.stringify(gameData),
    margin: 10,
    qrOptions: { typeNumber: 0, mode: "Byte", errorCorrectionLevel: "L" },
    dotsOptions: { color: "#000000", type: "rounded" },
    backgroundOptions: { color: "#ffffff" },
    cornersSquareOptions: { color: "#000000", type: "extra-rounded" },
    cornersDotOptions: { color: "#000000", type: "dot" }
};
```

### Final PNG wrapping (from `downloadQRCode()` in `app.js`)
- Canvas: 460x430 (400 + 30px padding each side, +30px bottom for text)
- White background
- Orange (`#FE5000`) rounded border (borderRadius=15, lineWidth=4)
- QR drawn at (30, 30, 400, 400)
- "r1 creations" text centered at bottom in bold 14px

### Node.js Script Reference
See `qr-gen/generate.js` for working example using `qrcode` + `canvas` packages.

## R1 Specs
- 480x480 canvas, scaled via CSS
- Scroll wheel = navigate, Side button = back (right-click), Touch = tap
- HTTPS required for creation codes
- GitHub Pages: https://mrghostguy.github.io/minimon/

## Game Design
- 12 types, 85 creatures, 104 moves, 20 TM items, 12 maps
- Growth rates: GROWTH_FAST=4, GROWTH_MEDIUM=8, GROWTH_SLOW=10
- Move cap: 4 moves per creature, forget UI when learning 5th
