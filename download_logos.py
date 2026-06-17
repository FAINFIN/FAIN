#!/usr/bin/env python3
"""
Download real bank logos into public/logos/
Run from the fain project root:  python3 download_logos.py
"""

import os, urllib.request, urllib.error, re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOGOS_DIR  = os.path.join(SCRIPT_DIR, 'public', 'logos')
TSX_FILE   = os.path.join(SCRIPT_DIR, 'src', 'components', 'landing', 'BankCarousel.tsx')

os.makedirs(LOGOS_DIR, exist_ok=True)

# Logos under MIN_BYTES are almost certainly 16×16 favicons — reject them
MIN_BYTES = 3_000

def headers(referer=None):
    h = {
        'User-Agent': (
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/124.0.0.0 Safari/537.36'
        ),
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    if referer:
        h['Referer'] = referer
    return h

def gfav(domain, sz=256):
    return f'https://www.google.com/s2/favicons?domain={domain}&sz={sz}'

# thebanks.eu logo helper (no referer needed)
def tb(name):
    return f'https://thebanks.eu/img/logos/{name}.png'

# (slug, bank_name, [(url, referer_or_None), ...])
BANKS = [
    ('bog', 'Bank of Georgia', [
        # thebanks.eu has a clean horizontal logo
        (tb('Bank_of_Georgia'), None),
        ('https://bankofgeorgia.ge/assets/manifest/icon-512x512.png', 'https://bankofgeorgia.ge/'),
        (gfav('bankofgeorgia.ge', 256), None),
    ]),
    ('tbc', 'TBC Bank', [
        ('https://upload.wikimedia.org/wikipedia/en/thumb/e/e2/TBC_Bank_logo.svg/3840px-TBC_Bank_logo.svg.png', None),
        ('https://d1.awsstatic.com/onedam/marketing-channels/website/aws/en_US/solution-case-studies/approved/images/tbc-bank-logo-1.29f18983676b8518256d0da40971a391be9a82d2.png', None),
        (tb('TBC_Bank'), None),
        (gfav('tbcbank.ge', 256), None),
    ]),
    ('basis', 'BasisBank', [
        (tb('Basisbank_GE'), None),
        (tb('Basisbank'), None),
        ('https://static.bb.ge/static/media/logo.svg', 'https://bb.ge/'),
        ('https://static.bb.ge/static/media/basisbank-logo.svg', 'https://bb.ge/'),
        (gfav('bb.ge', 256), None),
    ]),
    ('silk', 'Silk Road Bank', [
        ('https://old.silkbank.ge/assets/site/images/logo.png', 'https://old.silkbank.ge/'),
        (tb('Silk_Road_Bank'), None),
        ('https://silkbank.ge/images/logo.svg', 'https://silkbank.ge/'),
        (gfav('silkbank.ge', 256), None),
    ]),
    ('cartu', 'Cartu Bank', [
        (tb('Cartu_Bank'), None),
        ('https://www.cartubank.ge/assets/images/logo.png', 'https://www.cartubank.ge/'),
        (gfav('cartubank.ge', 256), None),
    ]),
    ('halyk', 'Halyk Bank', [
        ('https://upload.wikimedia.org/wikipedia/de/thumb/1/1c/Halyk_Bank_logo.svg/960px-Halyk_Bank_logo.svg.png', None),
        (tb('Halyk_Bank_Georgia'), None),
        (gfav('halykbank.ge', 256), None),
    ]),
    ('tera', 'Terabank', [
        ('https://terabank.ge/m/i/logo.svg', 'https://terabank.ge/'),
        (tb('TeraBank'), None),
        (gfav('terabank.ge', 256), None),
    ]),
    ('liberty', 'Liberty Bank', [
        ('https://libertybank.ge/m/i/logo-ka@2x.png', 'https://libertybank.ge/'),
        (tb('Liberty_Bank'), None),
        (gfav('libertybank.ge', 256), None),
    ]),
    ('pcb', 'ProCredit Bank', [
        ('https://procreditbank.ge/sites/default/files/pcb_logo_0_0.png', 'https://procreditbank.ge/'),
        (tb('ProCredit_Bank'), None),
        (gfav('procreditbank.ge', 256), None),
    ]),
    ('ziraat', 'Ziraat Bank', [
        ('https://ziraatbank.ge/media/5yzfvs4x/logo.svg', 'https://ziraatbank.ge/'),
        (tb('Ziraat_Bank_Georgia'), None),
        (gfav('ziraatbank.ge', 256), None),
    ]),
    ('pasha', 'Pasha Bank', [
        # AZ parent site
        ('https://www.pashabank.az/templates/images/pashabank-logo-az.svg', 'https://www.pashabank.az/'),
        ('https://www.pashabank.az/templates/images/pblogo.png', 'https://www.pashabank.az/'),
        (tb('Pasha_Bank_Georgia'), None),
        (tb('PASHA_Bank_Georgia'), None),
        (gfav('pashabank.ge', 256), None),
    ]),
    ('isbank', 'Isbank Georgia', [
        ('https://upload.wikimedia.org/wikipedia/commons/e/ef/Isbank_logo.svg', None),
        # Turkish parent İş Bankası desktop logo
        ('https://gorsel.isbank.com.tr/sttk/StaticFiles/Isbank/images/logo/isbankDlogo.png', 'https://www.isbank.com.tr/'),
        ('https://gorsel.isbank.com.tr/sttk/StaticFiles/Isbank/images/logo/isbank_logo_M.png', 'https://www.isbank.com.tr/'),
        (tb('Isbank'), None),
        (tb('Isbank_Georgia'), None),
        (gfav('isbank.com.tr', 256), None),
    ]),
    ('credo', 'Credo Bank', [
        ('https://imagedelivery.net/d_EE26O5eWcJDRYn-qMBOg/536c7168-93e8-49cb-2ea0-555f4b2a4e00/public', None),
        (tb('Credo_Bank'), None),
        (gfav('credobank.ge', 256), None),
    ]),
    ('paysera', 'Paysera', [
        # Main paysera.com compiled SVG logo
        ('https://www.paysera.com/v2/compiled/logo-v2.b1978817264e37108d51e1cb34d5bdb1.svg', 'https://www.paysera.com/'),
        ('https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Paysera_logo.svg/320px-Paysera_logo.svg.png', None),
        (tb('Paysera_Bank_Georgia'), None),
        (tb('Paysera'), None),
        (gfav('paysera.com', 256), None),
    ]),
]

def fetch(url, referer=None):
    req = urllib.request.Request(url, headers=headers(referer))
    with urllib.request.urlopen(req, timeout=15) as r:
        data = r.read()
        ct   = r.headers.get('Content-Type', '')
    # Reject HTML responses — these are error pages, not images
    if 'text/html' in ct:
        raise ValueError(f'Got HTML instead of image (Content-Type: {ct})')
    return data, ct

def ext_from(ct, url):
    if 'svg' in ct or url.lower().split('?')[0].endswith('.svg'):
        return 'svg'
    return 'png'

results = {}

print('Downloading bank logos…\n')

for slug, name, urls in BANKS:
    saved = False
    for url, referer in urls:
        try:
            data, ct = fetch(url, referer)
            if len(data) < MIN_BYTES:
                src = 'google-favicon' if 'google.com' in url else url
                print(f'  – {name}: too small ({len(data):,}b) — {src}')
                continue
            ext  = ext_from(ct, url)
            dest = os.path.join(LOGOS_DIR, f'{slug}.{ext}')
            # Remove old file with different extension
            for old_ext in ('png', 'svg'):
                old = os.path.join(LOGOS_DIR, f'{slug}.{old_ext}')
                if old != dest and os.path.exists(old):
                    os.remove(old)
            with open(dest, 'wb') as f:
                f.write(data)
            src = 'google-favicon' if 'google.com' in url else url
            print(f'  ✓ {name} → {slug}.{ext}  ({len(data):,}b)  [{src}]')
            results[slug] = ext
            saved = True
            break
        except urllib.error.HTTPError as e:
            print(f'  – {name}: HTTP {e.code} — {url}')
        except Exception as e:
            print(f'  – {name}: {e}')
    if not saved:
        # Keep whatever exists, or generate a minimal SVG placeholder
        existing = None
        for ext in ('png', 'svg'):
            p = os.path.join(LOGOS_DIR, f'{slug}.{ext}')
            if os.path.exists(p) and os.path.getsize(p) >= MIN_BYTES:
                existing = ext
                break
        if existing:
            print(f'  ≈ {name}: kept existing {slug}.{existing}')
            results[slug] = existing
        else:
            # Generate clean placeholder SVG
            initials = ''.join(w[0] for w in name.split()[:2]).upper()
            colors = {'bog':'#E85D25','tbc':'#00A0DC','basis':'#C8102E','silk':'#8B3FA8',
                      'cartu':'#003087','halyk':'#009B44','tera':'#E31E24','liberty':'#005BAA',
                      'pcb':'#FFCD00','ziraat':'#E30613','pasha':'#F05A28','isbank':'#003087',
                      'credo':'#00A651','paysera':'#4CAF50'}
            color = colors.get(slug, '#666')
            svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="{color}"/>
  <text x="32" y="42" text-anchor="middle" font-family="Arial,sans-serif"
        font-size="22" font-weight="700" fill="white">{initials}</text>
</svg>'''
            dest = os.path.join(LOGOS_DIR, f'{slug}.svg')
            with open(dest, 'w') as f:
                f.write(svg)
            print(f'  ⬜ {name}: generated placeholder → {slug}.svg')
            results[slug] = 'svg'

# ── Patch BankCarousel.tsx ─────────────────────────────────────────────────
if os.path.exists(TSX_FILE):
    with open(TSX_FILE) as f:
        tsx = f.read()

    lines = ['const BANKS = [']
    for slug, name, _ in BANKS:
        ext = results.get(slug, 'svg')
        pad = ' ' * max(1, 26 - len(name))
        lines.append(f"  {{ name: '{name}',{pad}slug: '{slug}', ext: '{ext}' }},")
    lines.append(']')
    new_banks = '\n'.join(lines)

    tsx2 = re.sub(r'const BANKS = \[.*?\]', new_banks, tsx, flags=re.DOTALL)
    tsx2 = re.sub(
        r'src=\{`/logos/\$\{b\.slug\}(?:\.\$\{b\.ext\}|\.svg)`\}',
        'src={`/logos/${b.slug}.${b.ext}`}',
        tsx2,
    )
    if tsx2 != tsx:
        with open(TSX_FILE, 'w') as f:
            f.write(tsx2)
        print('\n✓ BankCarousel.tsx patched.')
    else:
        print('\n  BankCarousel.tsx already up to date.')

print('\nDone! Now run:')
print('  git add public/logos src/components/landing/BankCarousel.tsx')
print('  git commit -m "fix: real logos for all banks via thebanks.eu"')
print('  git push origin main')
