# Apna Bazaar — Claude ke liye rules

## Zabaan
- User se hamesha **Roman Urdu / Roman English** mein baat karein (jaise: "Theek hai, fix kar diya").
- Code comments aur commit messages English ya Roman Urdu mein, jaise pehle se hain.

## Live website / deployment
- Site plain HTML/CSS/JS hai (koi build step nahi), **GitHub Pages** par `main` branch se live hoti hai:
  https://saifidigitalmarketing.github.io/apna-bazaar/
- `main` mein merge hote hi 1–2 minute mein site khud update ho jati hai. Vercel / Netlify ki zaroorat nahi.
- Kabhi bhi seedha `main` par push na karein. Kaam hamesha session ki apni branch par karein.

## PR workflow (user ka tareeqa)
1. Kaam branch par commit + push karein.
2. Jab user kahe **"PR do" / "create PR" / "PR bana do"** → `main` ke against Pull Request banayein
   (title + short Roman Urdu description: kya badla, kaise test kiya) aur user ko PR ka link dein.
3. User GitHub par **"Merge pull request" → "Confirm merge"** dabata hai → site live.
4. Merge ke baad agla kaam naye sire se latest `main` se shuru karein; merged PR dobara use na karein.

## Code notes
- **Cache:** `index.html` mein `style.css`, `script.js`, `checkout-location-fix.js` ke saath `?v=...` laga hai.
  In files mein koi bhi change ho to `index.html` mein `v` ka number badlein, warna phone purani file chalata rahega.
- `script.js` aur `style.css` **CRLF** line endings use karte hain — edit ke baad CRLF hi rehne dein warna poori file diff mein aa jati hai.
- Supabase: `products`, `orders`, `riders` tables, `rider-documents` storage bucket.
  Rider SQL: `rider-system-final.sql` (Supabase SQL Editor mein chalti hai; repo se apply nahi hoti).
- **Product images:** `admin-images.html` (admin sidebar → Product Images). Prompts aur tile→product mapping
  `product-image-batches.js` mein hain (9 products = 1 ChatGPT 3x3 grid image). Images `product-images` bucket mein WebP.
- Test: `python3 -m http.server` + Playwright (Chromium `/opt/pw-browsers` mein). Sandbox mein CDN
  (unpkg, jsdelivr) blocked hain — test mein `npm pack` se local copy route karein.
