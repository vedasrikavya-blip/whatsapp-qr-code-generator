# Project Introduction

WhatsApp QR Code Generator is a focused browser tool for turning a WhatsApp phone number and an optional pre-filled message into a scannable QR code. The project is designed for small businesses, independent professionals, sales teams, event organizers, restaurants, service providers, and anyone who wants to make starting a WhatsApp conversation easier. A visitor enters a phone number, writes the opening message that customers should see, tests the destination, and downloads a print-ready QR code. The interface is intentionally direct: the form and the result are both visible in the first screen on desktop, while mobile devices receive the same workflow in a clear top-to-bottom order.

The application is built as a static site and is suitable for GitHub Pages, Nginx, Apache, object storage, or any other host that can serve HTML, CSS, JavaScript, and image files. It does not require a database, login system, application server, or build framework. The included Node.js scripts are used only for repeatable tests, static output generation, and local preview. The deployed website remains a normal static application.

# What It Does

The tool creates a direct WhatsApp . When a message is provided, the text is encoded safely into the URL. The QR code stores that direct WhatsApp address, so a customer who scans the downloaded image goes straight to WhatsApp rather than visiting the generator website first. WhatsApp opens the selected conversation and places the prepared text in the message composer. The customer can review, edit, and send the message.

The result panel also includes an **Open in WhatsApp** action for testing before printing. This is important because it lets the person creating the QR code verify the country, phone number, and wording before placing the code on a business card, product package, menu, poster, receipt, shop sign, or event display.

The **Copy Link** action serves a different purpose. It copies the generator website address with the normalized international phone number and message stored in the URL hash. Opening that website link restores the country, local number, message, and generated QR code. This makes a setup easy to save, send to a designer, share with a colleague, or reopen for editing. The shared website link is not the same value as the QR code destination.

# How To Use

1. Open the website in a modern desktop or mobile browser.
2. Select the country or region associated with the WhatsApp phone number. The international calling code is shown and added automatically.
3. Enter the national phone number. A full international number beginning with a plus sign can also be pasted into the field.
4. Add an optional pre-filled message. The customer will see this message in WhatsApp and can edit it before sending.
5. Select **Generate QR Code**. The application validates and normalizes the number, creates the WhatsApp link, and renders the result.
6. Select **Open in WhatsApp** to test the destination and message.
7. Download PNG for common digital and print use, or SVG for scalable design and professional layout work.
8. Select **Copy Link** when the editable generator configuration needs to be saved or shared.

The page also offers simple foreground and background color controls. High contrast is recommended for reliable scanning. The tool displays the calculated contrast ratio and advises the user when the selected combination should be improved. Resetting the colors returns the QR code to black on white.

# Supported Formats

The primary downloadable formats are PNG and SVG.

**PNG** is generated at 1024 by 1024 pixels. It is suitable for documents, presentations, websites, social graphics, office printing, menus, labels, and most general design tools. The image contains a quiet zone around the QR modules and uses integer-aligned drawing to preserve crisp edges.

**SVG** is a vector format. It scales cleanly for business cards, posters, packaging, signs, large displays, and professional publishing software. The SVG contains simple rectangles and a background layer, making it portable and easy to place in layout applications.

The application also generates two URL formats. The first is the direct `wa.me` address embedded in the QR code and used by the WhatsApp test action. The second is the website configuration link copied by **Copy Link**. The configuration URL uses hash parameters so it can restore the form entirely in the browser without creating a separate indexable query page.

# Technical Details

The source stack is plain HTML, CSS, and modern JavaScript modules. `src/links.js` is responsible for number cleanup, direct WhatsApp URL creation, share URL creation, and share-state parsing. `src/phone.js` wraps the browser build of `libphonenumber-js` and returns a consistent normalized result containing the country, calling code, national number, formatted display value, E.164 value, and international digits. `src/qr.js` converts a QR matrix into a canvas drawing and an SVG document. `src/app.js` connects these domain functions to the page controls.

QR matrix generation uses the fixed browser version of the open-source `qrcode-generator` library. Phone parsing uses a fixed browser bundle of the open-source `libphonenumber-js` library. Both remote files are listed in the service worker application shell. During PWA installation, the service worker caches the complete local application and those fixed third-party browser files. On later requests, it tries the network first, updates the cache when a fresh response succeeds, and falls back to the cached response when the network is unavailable.

The project uses the Node.js built-in test runner, so test execution does not require downloading an npm test framework. Unit tests cover WhatsApp URL encoding, Unicode and line-break handling, website share links, URL-state restoration, phone wrapper behavior, international-number paste handling, QR matrix conversion, SVG output, canvas drawing, SEO markup, PWA files, icon dimensions, README requirements, repository configuration, and build behavior.

# Project Structure

```text
whatsapp-qr-code-generator/
├── index.html
├── favicon.svg
├── manifest.webmanifest
├── sw.js
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── maskable-512.png
├── src/
│   ├── app.js
│   ├── links.js
│   ├── phone.js
│   ├── qr.js
│   └── styles.css
├── scripts/
│   ├── build.mjs
│   └── serve.mjs
├── tests/
├── docs/
├── repo.config.json
├── package.json
├── LICENSE
└── README.md
```

The `tests` and `docs` directories support development but are excluded by `.gitignore` according to the project delivery rules. The versioned ZIP also excludes those directories, while the full working directory retains them for verification during development.

# Deployment

Run the automated checks first:

```bash
npm test
```

Generate the Nginx- or GitHub-Pages-ready output:

```bash
npm run build
```

The build script recreates only the `dist` directory. It copies the static application, icons, manifest, service worker, source modules, root README, license, and repository configuration. When a root `.github` directory already exists, it is copied into `dist` as requested. The script records whether the root `.git` directory exists before building and verifies that it still exists afterward. It never deletes or modifies `.git`.

For GitHub Pages, publish the contents of `dist` or serve the repository root directly. The canonical URL is configured as `https://github.com/vedasrikavya-blip/whatsapp-qr-code-generator.git`. For Nginx, point the document root to the generated `dist` directory and serve `index.html` as the directory index. Because the shared state is stored after the `#` character, no server rewrite rule is needed for restored configurations.

A basic local server is included:

```bash
npm run serve
```

Then open the printed localhost address. Service workers require HTTPS in production, while localhost is accepted for development.

# Repository

The intended repository name is `whatsapp-qr-code-generator`. The included `repo.config.json` defines the public visibility, homepage, default branch, source stack, Pages stack, description, and focused repository topics. The header contains a GitHub button pointing to the expected repository address and uses `nofollow`, `noopener`, and `noreferrer` relationship values.

The project does not generate a `.github` directory. This respects workflows in which deployment configuration is created separately. When such a directory is added later, the build process preserves and copies it into `dist` without making assumptions about its contents.

# Privacy

Phone numbers and messages are processed by JavaScript in the browser. The application itself does not include an analytics system, account system, database, API endpoint, or storage service. The copied setup link intentionally contains the normalized phone number and message because its purpose is to restore and share that configuration. Anyone who receives such a link can read the values encoded in it, so users should share configuration links with the same care they use for the phone number and message themselves.

The QR code contains the direct WhatsApp address. It does not route scanners through this website. The service worker stores static application resources in the browser cache to support offline fallback; it does not store submitted form data in a remote service.



