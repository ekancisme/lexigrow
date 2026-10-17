import urllib.request
import re

url = "https://eduvia.tokotema.xyz/template-kit/home/"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req).read().decode("utf-8")

# Extract all unique links on the site
pattern = re.compile(r'<a\s+[^>]*href=["\'](https?://eduvia\.tokotema\.xyz/[^"\']*)["\'][^>]*>(.*?)</a>', re.DOTALL)
seen = {}
for m in pattern.finditer(html):
    link = m.group(1).split('#')[0]
    text = re.sub(r'<[^>]+>', '', m.group(2)).strip()
    if link not in seen:
        seen[link] = text

print("Found", len(seen), "links:")
for l, t in sorted(seen.items()):
    print(f"[{t}] -> {l}")
