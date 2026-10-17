import urllib.request
import re
import os
import json
from urllib.parse import urlparse

pages = [
    "https://eduvia.tokotema.xyz/template-kit/home/",
    "https://eduvia.tokotema.xyz/template-kit/about-us/",
    "https://eduvia.tokotema.xyz/template-kit/courses/",
    "https://eduvia.tokotema.xyz/template-kit/course-details/",
    "https://eduvia.tokotema.xyz/template-kit/pricing/",
    "https://eduvia.tokotema.xyz/template-kit/teachers/",
    "https://eduvia.tokotema.xyz/template-kit/testimonials/",
    "https://eduvia.tokotema.xyz/template-kit/help-center/",
    "https://eduvia.tokotema.xyz/template-kit/contact-us/",
]

out_dir = os.path.abspath("public/assets/eduvia")
os.makedirs(out_dir, exist_ok=True)

all_images = set()
pattern = re.compile(r'https?://eduvia\.tokotema\.xyz/wp-content/uploads/[^"\'\s><\)]+\.(?:jpg|jpeg|png|webp|svg)', re.IGNORECASE)

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

for p in pages:
    try:
        req = urllib.request.Request(p, headers=headers)
        html = urllib.request.urlopen(req, timeout=10).read().decode("utf-8")
        found = pattern.findall(html)
        print(f"Page {p} -> found {len(found)} images")
        for img_url in found:
            all_images.add(img_url)
    except Exception as e:
        print(f"Failed to fetch {p}: {e}")

print(f"\nTotal unique images found: {len(all_images)}")

manifest = {}
downloaded_count = 0

for img_url in sorted(all_images):
    parsed = urlparse(img_url)
    filename = os.path.basename(parsed.path)
    target_path = os.path.join(out_dir, filename)
    manifest[filename] = {
        "url": img_url,
        "local": f"/assets/eduvia/{filename}"
    }
    if not os.path.exists(target_path):
        try:
            req = urllib.request.Request(img_url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                with open(target_path, "wb") as f:
                    f.write(data)
            downloaded_count += 1
            print(f"Downloaded: {filename} ({len(data)} bytes)")
        except Exception as e:
            print(f"Error downloading {img_url}: {e}")
    else:
        # print(f"Already exists: {filename}")
        pass

with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"\nDone! Downloaded {downloaded_count} new files. Manifest saved with {len(manifest)} entries.")
