#!/usr/bin/env python3
"""
GMC Section Newsletters — Master Download Script
Downloads all publicly available newsletters from 9 GMC sections.

Sections covered (each gets its own folder):
  bennington-stepping-stone/       The Stepping Stone (scraped from website)
  connecticut-trail-talk/          Trail Talk, 1999–2023 (100 issues, hardcoded)
  killington-smoke-and-blazes/     Smoke & Blazes current issues (scraped)
  montpelier-trail-talk/           Trail Talk (scraped from index)
  northeast-kingdom-ramblings/     Ramblings PDFs, 2020–2021 (4 issues)
  northern-frontier-newsletter/    Seasonal newsletter (scraped)
  sterling-stomper/                Sterling Stomper (scraped)
  upper-valley-ottauquechee-footnotes/  Footnotes, 2013–2026 (53 issues, hardcoded)
  worcester-newsletter/            Newsletter (scraped)

Already covered by separate scripts (not duplicated here):
  smoke-and-blazes/                Killington Internet Archive bulk PDFs
  ridgelines/                      Burlington RidgeLines (download_ridgelines.py)
  long-trail-news/                 GMC Long Trail News (download_ltn.py)
  long-trail-guide-books/          Long Trail Guidebooks (download_guides.py)

Run from your Mac Terminal:
  python3 "/Users/johnneed/Claude/Projects/GMC-ARCHIVES/download_all_newsletters.py"

New entries are appended to manifest.csv (no duplicates by source URL).
"""

import urllib.request
import urllib.error
import re
import os
import csv
import time

# ── Configuration ──────────────────────────────────────────────────────────────

ARCHIVE_ROOT = os.path.dirname(os.path.abspath(__file__))
MANIFEST_PATH = os.path.join(ARCHIVE_ROOT, "manifest.csv")
MANIFEST_HEADER = ["collection", "publication", "year", "issue_or_edition",
                   "filename", "source_url", "notes"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
}

# ── Shared helpers ─────────────────────────────────────────────────────────────

def fetch(url):
    """GET a URL, return (text, final_url). Returns ('', url) on failure."""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            ct = r.headers.get("Content-Type", "")
            enc = "utf-8"
            if "charset=" in ct:
                enc = ct.split("charset=")[-1].split(";")[0].strip()
            return raw.decode(enc, errors="replace"), r.url
    except Exception as e:
        print(f"    [fetch failed] {url}: {e}")
        return "", url


def download_pdf(url, dest):
    """Download a PDF to dest. Returns True on success. Skips if already present."""
    if os.path.exists(dest):
        kb = os.path.getsize(dest) / 1024
        print(f"  [skip] {os.path.basename(dest)} ({kb:.0f} KB)")
        return True
    tmp = dest + ".tmp"
    h = dict(HEADERS)
    h["Accept"] = "application/pdf,*/*"
    try:
        req = urllib.request.Request(url, headers=h)
        with urllib.request.urlopen(req, timeout=60) as r, open(tmp, "wb") as f:
            while True:
                chunk = r.read(256 * 1024)
                if not chunk:
                    break
                f.write(chunk)
        os.rename(tmp, dest)
        kb = os.path.getsize(dest) / 1024
        print(f"  OK  {os.path.basename(dest)} ({kb:.0f} KB)")
        return True
    except Exception as e:
        print(f"  FAIL {os.path.basename(dest)}: {e}")
        if os.path.exists(tmp):
            os.remove(tmp)
        return False


def mkdir(folder_name):
    path = os.path.join(ARCHIVE_ROOT, folder_name)
    os.makedirs(path, exist_ok=True)
    return path


def find_year(s):
    m = re.search(r'(20\d\d|19\d\d)', s)
    return m.group(1) if m else ""


def append_to_manifest(new_entries):
    """
    Append new_entries to manifest.csv, skipping rows whose source_url already exists.
    new_entries: list of dicts with keys matching MANIFEST_HEADER.
    """
    existing_rows = []
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, newline="", encoding="utf-8") as f:
            existing_rows = list(csv.reader(f))

    header = existing_rows[0] if existing_rows else MANIFEST_HEADER
    url_col = 5  # source_url column index
    existing_urls = {r[url_col] for r in existing_rows[1:] if len(r) > url_col}

    to_add = [e for e in new_entries if e.get("source_url", "") not in existing_urls]

    mode = "a" if existing_rows else "w"
    with open(MANIFEST_PATH, mode, newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if not existing_rows:
            w.writerow(header)
        for e in to_add:
            w.writerow([e.get(k, "") for k in MANIFEST_HEADER])

    skipped = len(new_entries) - len(to_add)
    print(f"  → manifest: +{len(to_add)} new entries"
          + (f" ({skipped} already present)" if skipped else ""))
    return len(to_add)


# ── Section 1: Bennington — The Stepping Stone ────────────────────────────────

def run_bennington():
    print("\n══ Bennington Section — The Stepping Stone ══════════════════")
    folder = mkdir("bennington-stepping-stone")
    base = "https://www.benningtongmc.org"
    seen_urls = set()
    entries = []

    # Scrape up to 5 paginated newsletter pages
    for page_num in range(1, 6):
        if page_num == 1:
            page_url = f"{base}/newsletters"
        else:
            page_url = f"{base}/newsletters/previous/{page_num}"

        html, _ = fetch(page_url)
        if not html:
            break

        pdfs = re.findall(
            r'(https?://www\.benningtongmc\.org/uploads/[^\s"\'<>]+\.pdf)',
            html, re.IGNORECASE
        )
        new_this_page = 0
        for pdf_url in pdfs:
            if pdf_url in seen_urls:
                continue
            seen_urls.add(pdf_url)
            new_this_page += 1
            bname = pdf_url.split("/")[-1]
            fname = f"SteppingStone_{bname}"
            dest = os.path.join(folder, fname)
            ok = download_pdf(pdf_url, dest)
            if ok:
                entries.append({
                    "collection": "Bennington Section GMC",
                    "publication": "The Stepping Stone",
                    "year": find_year(bname),
                    "issue_or_edition": bname.replace(".pdf", ""),
                    "filename": os.path.join("bennington-stepping-stone", fname),
                    "source_url": pdf_url,
                    "notes": "",
                })

        if new_this_page == 0 and page_num > 1:
            break  # no new PDFs on this page, stop paginating
        time.sleep(0.5)

    append_to_manifest(entries)
    print(f"  Bennington total: {len(entries)} files")
    return len(entries)


# ── Section 2: Connecticut — Trail Talk ───────────────────────────────────────
# All 100 issues 1999–2023, scraped from conngmc.com newsletter archive page.
# Each URL is a CMS download endpoint that serves the PDF.

CT_ISSUES = [
    # (year, season/label, CMS file ID)
    ("2023", "Spring",   132), ("2023", "Winter",   131),
    ("2022", "Fall",     130), ("2022", "Summer",   129),
    ("2022", "Spring",   127), ("2022", "Winter",   128),
    ("2021", "Fall",     126), ("2021", "Summer",   125),
    ("2021", "Spring",   124), ("2021", "Winter",   121),
    ("2020", "Fall",     122), ("2020", "Summer",   123),
    ("2020", "Spring",   120), ("2020", "Winter",   119),
    ("2019", "Spring",   118), ("2019", "Winter",   117),
    ("2018", "Fall",     116), ("2018", "Summer",   115),
    ("2018", "Spring-2", 111), ("2018", "Spring-1", 110),
    ("2017", "Fall-2",   113), ("2017", "Fall-1",   112),
    ("2017", "Summer",   114), ("2017", "Spring",   108),
    ("2017", "Winter",   107),
    ("2016", "Fall",     105), ("2016", "Summer",   109),
    ("2016", "Spring",   104), ("2016", "Winter",   103),
    ("2015", "Summer",   102), ("2015", "Spring",   101),
    ("2015", "Winter",    99),
    ("2014", "Fall",      96), ("2014", "Summer",    97),
    ("2014", "Spring",    98), ("2014", "Winter",    92),
    ("2013", "Fall",      94), ("2013", "Summer",    93),
    ("2013", "Spring",    95), ("2013", "Winter",    10),
    ("2012", "Fall",      68), ("2012", "Summer",    64),
    ("2012", "Spring",    27),
    ("2011", "Fall",      76), ("2011", "Summer",    61),
    ("2011", "Spring",    70), ("2011", "Winter",    71),
    ("2010", "Fall",      69), ("2010", "Summer",    60),
    ("2010", "Spring",    39), ("2010", "Winter",    51),
    ("2009", "Fall",      73), ("2009", "Summer",    59),
    ("2009", "Spring",    32), ("2009", "Winter",    72),
    ("2008", "Fall",      80), ("2008", "Summer",    58),
    ("2008", "Spring",    31), ("2008", "Winter",    50),
    ("2007", "Fall",      79), ("2007", "Summer",    57),
    ("2007", "Spring",    30), ("2007", "Winter",    49),
    ("2006", "Fall",      78), ("2006", "Summer",    56),
    ("2006", "Spring",    29), ("2006", "Winter",    48),
    ("2005", "Fall",      77), ("2005", "Summer",    55),
    ("2005", "Spring",    28), ("2005", "Winter",    53),
    ("2004", "Fall",      83), ("2004", "Summer",    63),
    ("2004", "Spring",    38), ("2004", "Winter",    47),
    ("2003", "Fall",      74), ("2003", "Summer",    54),
    ("2003", "Spring",    37), ("2003", "Winter",    46),
    ("2002", "Fall",      82), ("2002", "Summer",    62),
    ("2002", "Spring",    36), ("2002", "Winter",    52),
    ("2001", "Fall",      81), ("2001", "Summer",    42),
    ("2001", "Spring",    67), ("2001", "Winter",    35),
    ("2000", "Fall",      41), ("2000", "Summer",    66),
    ("2000", "Spring",    34), ("2000", "Winter",    44),
    ("1999", "December",  43), ("1999", "October",   75),
    ("1999", "August",    40), ("1999", "June",      65),
    ("1999", "April",     33),
]

def run_connecticut():
    print("\n══ Connecticut Section — Trail Talk ══════════════════════════")
    folder = mkdir("connecticut-trail-talk")
    entries = []
    dl_base = "https://conngmc.com/index.php/download_file/view/{fid}/144/"

    for year, season, fid in CT_ISSUES:
        url = dl_base.format(fid=fid)
        fname = f"Trail_Talk_{year}_{season}.pdf"
        dest = os.path.join(folder, fname)
        ok = download_pdf(url, dest)
        if ok:
            entries.append({
                "collection": "Connecticut Section GMC",
                "publication": "Trail Talk",
                "year": year,
                "issue_or_edition": f"{season} {year}",
                "filename": os.path.join("connecticut-trail-talk", fname),
                "source_url": url,
                "notes": "",
            })
        time.sleep(0.15)

    append_to_manifest(entries)
    print(f"  Connecticut total: {len(entries)} files")
    return len(entries)


# ── Section 3: Killington — Smoke & Blazes (current issues from website) ──────
# Note: the large historical archive PDFs (1948–2016, 2013–2020) from the
# Internet Archive are downloaded separately via smoke-and-blazes/download_smoke_and_blazes.py

def run_killington():
    print("\n══ Killington Section — Smoke & Blazes (current) ════════════")
    folder = mkdir("killington-smoke-and-blazes")
    seen = set()
    entries = []

    for page_url in [
        "https://gmckillington.org/",
        "https://gmckillington.org/archive/",
    ]:
        html, _ = fetch(page_url)
        if not html:
            continue
        pdfs = re.findall(
            r'(https?://gmckillington\.org/wp-content/uploads/[^\s"\'<>]+\.pdf)',
            html, re.IGNORECASE
        )
        for pdf_url in pdfs:
            if pdf_url in seen:
                continue
            seen.add(pdf_url)
            bname = pdf_url.split("/")[-1]
            dest = os.path.join(folder, bname)
            ok = download_pdf(pdf_url, dest)
            if ok:
                yr = find_year(pdf_url)
                label = bname.replace(".pdf", "").replace("-", " ").replace("_", " ")
                entries.append({
                    "collection": "Killington Section GMC",
                    "publication": "Smoke & Blazes",
                    "year": yr,
                    "issue_or_edition": label,
                    "filename": os.path.join("killington-smoke-and-blazes", bname),
                    "source_url": pdf_url,
                    "notes": "Individual issue from gmckillington.org",
                })

    if not entries:
        print("  NOTE: No individual issue PDFs found on gmckillington.org.")
        print("        Historical archive is in smoke-and-blazes/ (download_smoke_and_blazes.py)")

    append_to_manifest(entries)
    print(f"  Killington total: {len(entries)} files")
    return len(entries)


# ── Section 4: Montpelier — Trail Talk ────────────────────────────────────────

def run_montpelier():
    print("\n══ Montpelier Section — Trail Talk ══════════════════════════")
    folder = mkdir("montpelier-trail-talk")
    base = "https://gmcmontpelier.org"
    seen = set()
    entries = []

    # Try multiple entry points
    urls_to_scrape = [
        f"{base}/archives/TrailTalk/index.htm",
        f"{base}/TT_redirect.html",
        f"{base}/archives/index.htm",
    ]

    for page_url in urls_to_scrape:
        html, final_url = fetch(page_url)
        if not html:
            continue

        # Direct PDF links on the page
        pdfs = re.findall(r'(https?://[^\s"\'<>]+\.pdf)', html, re.IGNORECASE)
        rel_pdfs = re.findall(r'href=["\']([^"\']+\.pdf)["\']', html, re.IGNORECASE)
        for rp in rel_pdfs:
            pdfs.append(rp if rp.startswith("http") else base + "/" + rp.lstrip("/"))

        for pdf_url in pdfs:
            if "gmcmontpelier.org" not in pdf_url:
                continue
            if pdf_url in seen:
                continue
            seen.add(pdf_url)
            bname = pdf_url.split("/")[-1]
            dest = os.path.join(folder, bname)
            ok = download_pdf(pdf_url, dest)
            if ok:
                yr = find_year(bname + pdf_url)
                entries.append({
                    "collection": "Montpelier Section GMC",
                    "publication": "Trail Talk",
                    "year": yr,
                    "issue_or_edition": bname.replace(".pdf", ""),
                    "filename": os.path.join("montpelier-trail-talk", bname),
                    "source_url": pdf_url,
                    "notes": "",
                })

        # If we found PDFs, no need to continue scraping
        if entries:
            break

    if not entries:
        print("  NOTE: Montpelier Trail Talk index not directly scrapeable.")
        print(f"        Browse manually: {base}/archives/TrailTalk/index.htm")
        print(f"        Current issue:   {base}/TT_redirect.html")

    append_to_manifest(entries)
    print(f"  Montpelier total: {len(entries)} files")
    return len(entries)


# ── Section 5: Northeast Kingdom — Ramblings ──────────────────────────────────
# Issues from 2022 onward are Mailchimp (HTML, no PDF download).
# These 4 issues are available as direct PDF downloads.

NEK_ISSUES = [
    ("2021", "Summer", "https://www.nekgmc.org/wp-content/uploads/2021/08/3-1-Ramblings.pdf"),
    ("2021", "Spring", "https://www.nekgmc.org/wp-content/uploads/2021/04/2-4-Ramblings.pdf"),
    ("2021", "Winter", "https://www.nekgmc.org/wp-content/uploads/2021/01/2-3-Ramblings.pdf"),
    ("2020", "Fall",   "https://www.nekgmc.org/wp-content/uploads/2020/10/2-2-Ramblings.pdf"),
]

def run_nek():
    print("\n══ Northeast Kingdom Section — Ramblings ════════════════════")
    folder = mkdir("northeast-kingdom-ramblings")
    entries = []

    for year, season, url in NEK_ISSUES:
        bname = url.split("/")[-1]
        fname = f"Ramblings_{year}_{season}_{bname}"
        dest = os.path.join(folder, fname)
        ok = download_pdf(url, dest)
        if ok:
            entries.append({
                "collection": "Northeast Kingdom Section GMC",
                "publication": "Ramblings",
                "year": year,
                "issue_or_edition": f"{season} {year}",
                "filename": os.path.join("northeast-kingdom-ramblings", fname),
                "source_url": url,
                "notes": "Issues from Fall 2021 onward are Mailchimp HTML only",
            })
        time.sleep(0.3)

    append_to_manifest(entries)
    print(f"  Northeast Kingdom total: {len(entries)} files")
    print("  NOTE: Issues from Fall 2021 onward are published via Mailchimp (no PDF download).")
    print("        See nekgmc.org/newsletters/ for links.")
    return len(entries)


# ── Section 6: Northern Frontier — Newsletter ─────────────────────────────────

def run_northern_frontier():
    print("\n══ Northern Frontier Section — Newsletter ═══════════════════")
    folder = mkdir("northern-frontier-newsletter")
    base = "http://gmcnorthernfrontier.org"
    seen = set()
    entries = []

    for page_url in [base + "/", base + "/news.php"]:
        html, _ = fetch(page_url)
        if not html:
            continue

        # Look for PDF links
        pdfs = re.findall(
            r'(https?://gmcnorthernfrontier\.org/[^\s"\'<>]+\.pdf)',
            html, re.IGNORECASE
        )
        rel = re.findall(r'href=["\']([^"\']+\.pdf)["\']', html, re.IGNORECASE)
        for rp in rel:
            pdfs.append(rp if rp.startswith("http") else base + "/" + rp.lstrip("/"))

        for pdf_url in pdfs:
            if pdf_url in seen:
                continue
            seen.add(pdf_url)
            bname = pdf_url.split("/")[-1]
            dest = os.path.join(folder, bname)
            ok = download_pdf(pdf_url, dest)
            if ok:
                yr = find_year(bname)
                label = (bname.replace(".pdf", "")
                             .replace("NorthernFrontierSection", "")
                             .replace("-", " ")
                             .replace("Newsletter", "Newsletter ").strip())
                entries.append({
                    "collection": "Northern Frontier Section GMC",
                    "publication": "Newsletter",
                    "year": yr,
                    "issue_or_edition": label,
                    "filename": os.path.join("northern-frontier-newsletter", bname),
                    "source_url": pdf_url,
                    "notes": "",
                })

    if not entries:
        print("  NOTE: No newsletter PDFs found via scraping — trying known URL directly.")
        url = f"{base}/NorthernFrontierSectionSummer-Fall2026Newsletter.pdf"
        bname = url.split("/")[-1]
        dest = os.path.join(folder, bname)
        ok = download_pdf(url, dest)
        if ok:
            entries.append({
                "collection": "Northern Frontier Section GMC",
                "publication": "Newsletter",
                "year": "2026",
                "issue_or_edition": "Summer-Fall 2026",
                "filename": os.path.join("northern-frontier-newsletter", bname),
                "source_url": url,
                "notes": "",
            })

    append_to_manifest(entries)
    print(f"  Northern Frontier total: {len(entries)} files")
    return len(entries)


# ── Section 7: Sterling — Sterling Stomper ────────────────────────────────────

def run_sterling():
    print("\n══ Sterling Section — Sterling Stomper ══════════════════════")
    folder = mkdir("sterling-stomper")
    base = "http://gmcsterling.org"
    seen = set()
    entries = []

    for page_url in [base + "/", base + "/newsletter"]:
        html, _ = fetch(page_url)
        if not html:
            continue
        pdfs = re.findall(r'href=["\']([^"\']+\.pdf)["\']', html, re.IGNORECASE)
        for rp in pdfs:
            url = rp if rp.startswith("http") else base + "/" + rp.lstrip("/")
            if url in seen:
                continue
            seen.add(url)
            bname = url.split("/")[-1]
            dest = os.path.join(folder, bname)
            ok = download_pdf(url, dest)
            if ok:
                yr = find_year(bname)
                entries.append({
                    "collection": "Sterling Section GMC",
                    "publication": "Sterling Stomper",
                    "year": yr,
                    "issue_or_edition": bname.replace(".pdf", "").replace("_", " "),
                    "filename": os.path.join("sterling-stomper", bname),
                    "source_url": url,
                    "notes": "",
                })

    if not entries:
        print("  NOTE: No Stomper PDFs found via scraping on gmcsterling.org.")
        print("        The site may have moved or the PDF link structure changed.")

    append_to_manifest(entries)
    print(f"  Sterling total: {len(entries)} files")
    return len(entries)


# ── Section 8: Upper Valley Ottauquechee — Footnotes ─────────────────────────
# 53 issues, 2013–2026, from uppervalleygmc.org/newsletters/

UVO_ISSUES = [
    # (year, quarter label, URL)
    ("2026", "March",    "https://uppervalleygmc.org/wp-content/uploads/2026/02/2026-Mar-FOOTNOTES-All.pdf"),
    ("2025", "December", "https://uppervalleygmc.org/wp-content/uploads/2025/11/2025-Dec-FOOTNOTES-All.pdf"),
    ("2025", "September","https://uppervalleygmc.org/wp-content/uploads/2025/09/2025-Sept_FOOTNOTES_all.pdf"),
    ("2025", "June",     "https://uppervalleygmc.org/wp-content/uploads/2025/06/2025-Jun-FOOTNOTES-All.pdf"),
    ("2025", "March",    "https://uppervalleygmc.org/wp-content/uploads/2025/03/2025-Mar-FOOTNOTES-All.pdf"),
    ("2024", "December", "https://uppervalleygmc.org/wp-content/uploads/2024/12/2024-Dec-FOOTNOTES-all.pdf"),
    ("2024", "September","https://uppervalleygmc.org/wp-content/uploads/2024/08/2024-Sept-FOOTNOTES-all.pdf"),
    ("2024", "June",     "https://uppervalleygmc.org/wp-content/uploads/2024/05/2024-June-FOOTNOTES-all.pdf"),
    ("2024", "March",    "https://uppervalleygmc.org/wp-content/uploads/2024/02/2024-Mar-FOOTNOTES-All.pdf"),
    ("2023", "December", "https://uppervalleygmc.org/wp-content/uploads/2023/11/2023-Dec-FOOTNOTES_-All.pdf"),
    ("2023", "September","https://uppervalleygmc.org/wp-content/uploads/2023/10/2023_Sept-FOOTNOTES-all.pdf"),
    ("2023", "June",     "https://uppervalleygmc.org/wp-content/uploads/2023/06/2023-June-FOOTNOTES_all.pdf"),
    ("2023", "March",    "https://uppervalleygmc.org/wp-content/uploads/2023/04/2023-UVO-March-FOOTNOTES.pdf"),
    ("2022", "December", "https://uppervalleygmc.org/wp-content/uploads/2023/04/2022Dec-footnotes.pdf"),
    ("2022", "September","https://uppervalleygmc.org/wp-content/uploads/2023/04/2022Sep-footnotes.pdf"),
    ("2022", "June",     "https://uppervalleygmc.org/wp-content/uploads/2023/04/2022June-footnotes.pdf"),
    ("2022", "March",    "https://uppervalleygmc.org/wp-content/uploads/2023/04/2022Mar-footnotes.pdf"),
    ("2021", "December", "https://uppervalleygmc.org/wp-content/uploads/2023/04/2021Dec-footnotes.pdf"),
    ("2021", "September","https://uppervalleygmc.org/wp-content/uploads/2023/04/2021Sep-footnotes.pdf"),
    ("2021", "June",     "https://uppervalleygmc.org/wp-content/uploads/2023/04/2021June-footnotes.pdf"),
    ("2021", "March",    "https://uppervalleygmc.org/wp-content/uploads/2023/04/2021Mar-footnotes.pdf"),
    ("2020", "December", "https://uppervalleygmc.org/wp-content/uploads/2023/04/2020Dec-footnotes.pdf"),
    ("2020", "September","https://uppervalleygmc.org/wp-content/uploads/2023/04/2020Sept-footnotes.pdf"),
    ("2020", "June",     "https://uppervalleygmc.org/wp-content/uploads/2023/04/2020June-footnotes.pdf"),
    ("2020", "March",    "https://uppervalleygmc.org/wp-content/uploads/2023/04/2020Mar-footnotes.pdf"),
    ("2019", "December", "https://uppervalleygmc.org/wp-content/uploads/2023/04/2019Dec-footnotes.pdf"),
    ("2019", "September","https://uppervalleygmc.org/wp-content/uploads/2023/04/2019Sep-footnotes.pdf"),
    ("2019", "June",     "https://uppervalleygmc.org/wp-content/uploads/2023/04/2019June-footnotes.pdf"),
    ("2019", "March",    "https://uppervalleygmc.org/wp-content/uploads/2023/04/2019Mar-footnotes.pdf"),
    ("2018", "December", "https://uppervalleygmc.org/wp-content/uploads/2023/04/2018Dec-footnotes.pdf"),
    ("2018", "September","https://uppervalleygmc.org/wp-content/uploads/2023/04/2018Sep-footnotes.pdf"),
    ("2018", "June",     "https://uppervalleygmc.org/wp-content/uploads/2023/04/2018June-footnotes.pdf"),
    ("2018", "March",    "https://uppervalleygmc.org/wp-content/uploads/2023/04/2018Mar-footnotes.pdf"),
    ("2017", "December", "https://uppervalleygmc.org/wp-content/uploads/2023/04/2017Dec-footnotes.pdf"),
    ("2017", "September","https://uppervalleygmc.org/wp-content/uploads/2023/04/2017Sep-footnotes.pdf"),
    ("2017", "June",     "https://uppervalleygmc.org/wp-content/uploads/2023/04/2017June-footnotes.pdf"),
    ("2017", "March",    "https://uppervalleygmc.org/wp-content/uploads/2023/04/2017Mar-footnotes.pdf"),
    ("2016", "December", "https://uppervalleygmc.org/wp-content/uploads/2023/04/2016Dec-footnotes.pdf"),
    ("2016", "September","https://uppervalleygmc.org/wp-content/uploads/2023/04/2016Sep-footnotes.pdf"),
    ("2016", "June",     "https://uppervalleygmc.org/wp-content/uploads/2023/04/2016June-footnotes.pdf"),
    ("2016", "March",    "https://uppervalleygmc.org/wp-content/uploads/2023/04/2016Mar-footnotes.pdf"),
    ("2015", "December", "https://uppervalleygmc.org/wp-content/uploads/2023/04/2015Dec-footnotes.pdf"),
    ("2015", "September","https://uppervalleygmc.org/wp-content/uploads/2023/04/2015Sep-footnotes.pdf"),
    ("2015", "June",     "https://uppervalleygmc.org/wp-content/uploads/2023/04/2015June-footnotes.pdf"),
    ("2015", "March",    "https://uppervalleygmc.org/wp-content/uploads/2023/04/2015Mar-footnotes.pdf"),
    ("2014", "December", "https://uppervalleygmc.org/wp-content/uploads/2023/04/2014Dec-footnotes.pdf"),
    ("2014", "September","https://uppervalleygmc.org/wp-content/uploads/2023/04/2014Sept-footnotes.pdf"),
    ("2014", "June",     "https://uppervalleygmc.org/wp-content/uploads/2023/04/2014June-footnotes.pdf"),
    ("2014", "March",    "https://uppervalleygmc.org/wp-content/uploads/2023/04/2014Mar-footnotes.pdf"),
    ("2013", "December", "https://uppervalleygmc.org/wp-content/uploads/2023/04/2013Dec-footnotes.pdf"),
    ("2013", "September","https://uppervalleygmc.org/wp-content/uploads/2023/04/2913Sept-footnotes-1.pdf"),  # typo in original URL
    ("2013", "June",     "https://uppervalleygmc.org/wp-content/uploads/2023/04/2013June-footnotes.pdf"),
    ("2013", "March",    "https://uppervalleygmc.org/wp-content/uploads/2023/12/2013-March-FOOTNOTES.pdf"),
]

def run_uvo():
    print("\n══ Upper Valley Ottauquechee — Footnotes ════════════════════")
    folder = mkdir("upper-valley-ottauquechee-footnotes")
    entries = []

    for year, month, url in UVO_ISSUES:
        fname = f"Footnotes_{year}_{month}.pdf"
        dest = os.path.join(folder, fname)
        ok = download_pdf(url, dest)
        if ok:
            entries.append({
                "collection": "Upper Valley Ottauquechee Section GMC",
                "publication": "Footnotes",
                "year": year,
                "issue_or_edition": f"{month} {year}",
                "filename": os.path.join("upper-valley-ottauquechee-footnotes", fname),
                "source_url": url,
                "notes": "",
            })
        time.sleep(0.15)

    append_to_manifest(entries)
    print(f"  Upper Valley Ottauquechee total: {len(entries)} files")
    return len(entries)


# ── Section 9: Worcester — Newsletter ─────────────────────────────────────────

def run_worcester():
    print("\n══ Worcester Section — Newsletter ═══════════════════════════")
    folder = mkdir("worcester-newsletter")
    seen = set()
    entries = []

    # Scrape the site for newsletter PDFs
    for page_url in ["https://gmcwoo.org/", "https://gmcwoo.org/news/"]:
        html, _ = fetch(page_url)
        if not html:
            continue
        pdfs = re.findall(
            r'(https?://gmcwoo\.org/wp-content/uploads/[^\s"\'<>]+\.pdf)',
            html, re.IGNORECASE
        )
        for pdf_url in pdfs:
            if pdf_url in seen:
                continue
            seen.add(pdf_url)
            bname = pdf_url.split("/")[-1]
            dest = os.path.join(folder, bname)
            ok = download_pdf(pdf_url, dest)
            if ok:
                yr = find_year(pdf_url)
                entries.append({
                    "collection": "Worcester Section GMC",
                    "publication": "Newsletter",
                    "year": yr,
                    "issue_or_edition": bname.replace(".pdf", "").replace("-", " "),
                    "filename": os.path.join("worcester-newsletter", bname),
                    "source_url": pdf_url,
                    "notes": "",
                })

    # Known fallback URL (Winter 2022)
    fallback = "https://gmcwoo.org/wp-content/uploads/2022/04/GMC-Worcester-Newsletter-Winter-2022-March-April.pdf"
    if fallback not in seen:
        bname = fallback.split("/")[-1]
        dest = os.path.join(folder, bname)
        ok = download_pdf(fallback, dest)
        if ok:
            seen.add(fallback)
            entries.append({
                "collection": "Worcester Section GMC",
                "publication": "Newsletter",
                "year": "2022",
                "issue_or_edition": "Winter 2022 (March-April)",
                "filename": os.path.join("worcester-newsletter", bname),
                "source_url": fallback,
                "notes": "",
            })

    append_to_manifest(entries)
    print(f"  Worcester total: {len(entries)} files")
    return len(entries)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("GMC Section Newsletters — Master Download")
    print(f"Archive root: {ARCHIVE_ROOT}")
    print("=" * 60)

    results = [
        ("Bennington (Stepping Stone)",             run_bennington()),
        ("Connecticut (Trail Talk, 1999–2023)",      run_connecticut()),
        ("Killington (Smoke & Blazes, current)",     run_killington()),
        ("Montpelier (Trail Talk)",                  run_montpelier()),
        ("Northeast Kingdom (Ramblings, 2020–2021)", run_nek()),
        ("Northern Frontier (Newsletter)",           run_northern_frontier()),
        ("Sterling (Stomper)",                       run_sterling()),
        ("Upper Valley Ottauquechee (Footnotes)",    run_uvo()),
        ("Worcester (Newsletter)",                   run_worcester()),
    ]

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    total = 0
    for label, count in results:
        print(f"  {label:<50} {count:>4}")
        total += count
    print(f"  {'TOTAL':<50} {total:>4}")
    print(f"\nManifest: {MANIFEST_PATH}")
    print("\nNot covered here (separate scripts):")
    print("  smoke-and-blazes/      — Killington historical archive (Internet Archive)")
    print("  ridgelines/            — Burlington RidgeLines  (download_ridgelines.py)")
    print("  long-trail-news/       — GMC Long Trail News    (download_ltn.py)")
    print("  long-trail-guide-books/— Long Trail Guidebooks  (download_guides.py)")


if __name__ == "__main__":
    main()
