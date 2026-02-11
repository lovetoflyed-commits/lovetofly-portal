# TEST REPORT CONVERSION GUIDE
## How to Print/Convert HTML Reports to PDF

Both HTML reports have been professionally formatted for A4 printing with:
- ✓ Professional layout with company branding
- ✓ Page breaks at each chapter end
- ✓ Proper table formatting with cell text wrapping
- ✓ High-quality typography and colors
- ✓ Both English and Portuguese versions

---

## Files Available

### 1. English Version
- **File:** `TEST_REPORT_FULL_EN.html`
- **Size:** ~35KB
- **Pages (Estimated):** 25-30 pages when printed

### 2. Portuguese Version
- **File:** `TEST_REPORT_FULL_PT.html`
- **Size:** ~35KB
- **Pages (Estimated):** 25-30 pages when printed

---

## METHOD 1: Browser Print to PDF (Recommended)

### Using Chrome/Chromium
1. Open the HTML file in Chrome:
   ```bash
   open TEST_REPORT_FULL_EN.html  # macOS
   # or drag file to Chrome browser
   ```

2. Press `Cmd+P` (macOS) or `Ctrl+P` (Windows)

3. Configure Print Settings:
   - **Destination:** Save as PDF
   - **Paper Size:** A4
   - **Orientation:** Portrait
   - **Margins:** Default/Standard
   - **Scale:** 100%
   - **Background Graphics:** Checked (for colors)

4. Filename: `TEST_REPORT_LOVE_TO_FLY_PORTAL_EN.pdf`

5. Click **Save**

### Using Firefox
1. Open HTML file in Firefox
2. Press `Cmd+P` (macOS) or `Ctrl+P` (Windows)
3. Select "Print to File" or "Save as PDF"
4. Same settings as Chrome above
5. Save file

### Using Safari (macOS)
1. Open HTML file in Safari
2. Press `Cmd+P`
3. Click "PDF" dropdown (bottom-left)
4. Select "Save as PDF"
5. Name and save the file

---

## METHOD 2: Command Line Tools

### Using wkhtmltopdf (if installed)
```bash
# Install (macOS via Homebrew)
brew install wkhtmltopdf

# Convert file
wkhtmltopdf --page-size A4 TEST_REPORT_FULL_EN.html TEST_REPORT_EN.pdf

# With additional options
wkhtmltopdf \
  --page-size A4 \
  --margin-top 20 \
  --margin-right 20 \
  --margin-bottom 20 \
  --margin-left 20 \
  --print-media-type \
  TEST_REPORT_FULL_EN.html \
  TEST_REPORT_EN.pdf
```

### Using Pandoc
```bash
# Install
brew install pandoc

# Convert
pandoc TEST_REPORT_FULL_EN.html -o TEST_REPORT_EN.pdf
```

### Using Node.js & Puppeteer
```bash
npm install -g puppeteer

# Create conversion script
cat > convert_report.js << 'EOF'
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(`file://${path.resolve('TEST_REPORT_FULL_EN.html')}`, {
    waitUntil: 'networkidle2'
  });
  
  await page.pdf({
    path: 'TEST_REPORT_EN.pdf',
    format: 'A4',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  });
  
  await browser.close();
})();
EOF

node convert_report.js
```

---

## METHOD 3: Online Converters

If you don't have desktop tools installed:

1. **HtmlToCSS.org** → `htmltocss.org`
2. **ILovePDF.com** → Upload HTML → Convert to PDF
3. **PDF.io** → Supports HTML to PDF
4. **CloudConvert.com** → Supports multiple formats

---

## printing recommendations

### Best Settings for Meeting Presentations

**When Converting to PDF:**
- ✓ Paper Size: A4 (210mm × 297mm)
- ✓ Orientation: Portrait
- ✓ Margins: 20mm all sides (already built-in)
- ✓ Scale: 100%
- ✓ Color Mode: Full Color (RGB)
- ✓ Background Graphics: YES

**When Printing PDF:**
- ✓ Paper: High-quality white (80gsm minimum)
- ✓ Color: Full color printer recommended
- ✓ Quality: High/Best quality setting
- ✓ Layout: Single-sided (double-sided optional)
- ✓ Binding: Left edge (for 25-30 page report)

---

## File Structure & Features

### Page Breaks
- ✅ Title page (full page)
- ✅ Table of Contents (full page, then break)
- ✅ Each section starts on new page
- ✅ Chapter breakdown prevents orphaned sections
- ✅ Page numbers included at bottom of each page

### Table Formatting
- ✅ Professional header styling (dark blue)
- ✅ Alternating row colors for readability
- ✅ Text wraps inside cells (no overflow)
- ✅ Proper borders and spacing
- ✅ Consistent font sizing (11pt tables)

### Professional Elements
- ✅ Company logo area
- ✅ Color-coded status badges (pass/fail/warn)
- ✅ Summary boxes with highlights
- ✅ Metric dashboards with visual hierarchy
- ✅ Code blocks with syntax highlighting (dark theme)

---

## File Naming Convention

After conversion, name files consistently:

```
TEST_REPORT_LOVE_TO_FLY_PORTAL_EN.pdf
TEST_REPORT_LOVE_TO_FLY_PORTAL_PT.pdf

OR by date:

TEST_REPORT_2026-02-11_EN.pdf
TEST_REPORT_2026-02-11_PT.pdf
```

---

## Meeting Presentation Checklist

Before using in meeting:

- [ ] PDF opens correctly in PDF reader
- [ ] All pages visible (should be 25-30)
- [ ] Text is readable and not cut off
- [ ] Images/colors display properly
- [ ] Page numbers visible at bottom
- [ ] Table of contents links work (if using interactive PDF viewer)
- [ ] Print preview looks acceptable
- [ ] Both English and Portuguese versions ready
- [ ] Save backup copies in shared location

---

## Distribution Options

### For Physical Meeting
- Print both versions (EN + PT)
- Spiral binding recommended
- Include table of contents
- Consider printing double-sided to save paper

### For Digital Distribution
- Email PDF versions to team
- Upload to project management tool (Jira, Confluence)
- Share via cloud storage (Google Drive, OneDrive)
- Embed in project documentation

### For Archival
- Store PDFs with date stamp
- Keep both HTML and PDF versions
- Include in project documentation folder
- Reference in sprint reports

---

## Troubleshooting

### PDF is too large/small
Check print scale setting - should be 100%

### Text is cut off at page edges
Check margin settings in browser print dialog
Ensure all are set to 20mm or higher

### Colors not showing
Enable "Background Graphics" in print settings
May need to use color printer or printer profile

### Page breaks in wrong places
This is normal - browser rendering varies slightly
PDF quality is still high

### Table text overlapping
PDF converted correctly - issue is viewer zoom level
Zoom to 100% or "Fit Page Width" in PDF reader

---

## Quick Start - Fastest Method

For the quickest PDF conversion:

```bash
# Open in Chrome and print to PDF (fastest)
open TEST_REPORT_FULL_EN.html
# Cmd+P → Save as PDF → Choose A4 → Done!

# Or one-command if you have wkhtmltopdf
wkhtmltopdf --page-size A4 TEST_REPORT_FULL_EN.html Report_EN.pdf && \
wkhtmltopdf --page-size A4 TEST_REPORT_FULL_PT.html Report_PT.pdf
```

---

## Technical Specifications

| Aspect | Value |
|--------|-------|
| **Format** | HTML 5 with CSS3 |
| **Document Type** | Professional Report |
| **Page Size** | A4 (210mm × 297mm) |
| **Orientation** | Portrait |
| **Margins** | 20mm all sides |
| **Languages** | English & Portuguese |
| **Total Pages** | ~25-30 per report |
| **File Size** | ~35KB (HTML) |
| **Font Family** | Segoe UI, sans-serif |
| **Color Scheme** | Professional Blue (#1e40af) |
| **Print Friendly** | Yes (optimized) |
| **Mobile Friendly** | Yes (responsive) |
| **Accessibility** | WCAG 2.1 Level A |

---

## Support & Contact

For questions about:
- Report content → Development Team
- PDF conversion → Use methods above
- Printing issues → IT Support
- Meeting distribution → Project Manager

---

**Generated:** February 11, 2026  
**Report Version:** 1.0  
**Last Updated:** 2026-02-11
