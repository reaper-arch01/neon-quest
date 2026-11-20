# NEON//QUEST v3 — credits and licenses

Everything in this build is free to use. There are no paid services, CDNs or trackers, and the app makes no network calls after the first load.

## Fonts (SIL Open Font License 1.1; full texts are in `assets/fonts/`)
| File | Source font | Copyright | License |
|---|---|---|---|
| `orbitron-var.woff2` | Orbitron (variable) | Copyright 2018 The Orbitron Project Authors (https://github.com/theleagueof/orbitron), with Reserved Font Name "Orbitron" | OFL 1.1 (`OFL-Orbitron.txt`) |
| `share-tech-mono.woff2` | Share Tech Mono | Copyright (c) 2012, Carrois Type Design, Ralph du Carrois, with Reserved Font Name "Share" | OFL 1.1 (`OFL-ShareTechMono.txt`) |
| `dela-gothic-one-subset.woff2` | Dela Gothic One (subset: Latin plus the ~30 Japanese glyphs the UI uses) | Copyright 2020 The Dela Gothic Project Authors (https://github.com/syakuzen/DelaGothic) | OFL 1.1 (`OFL-DelaGothicOne.txt`) |

The fonts are self-hosted. Orbitron and Dela Gothic One have been modified (converted to WOFF2, and Dela subset), and Share Tech Mono was converted, so all three load under different family names ("NQ Orbitron", "NQ Mono", "NQ Dela") to respect the Reserved Font Names. The fonts were converted with fontTools/pyftsubset (MIT).

## Buddy art
The buddy sprites in `assets/buddies/` are original designs made for this project from the project's own concept sheets (`design/v3-art/concept/`). They were generated with AI image tools, background-keyed with the project's own `tools/clean_sprite.py` (numpy, scipy and Pillow; BSD/HPND licenses) and saved as WebP. They are not based on any existing franchise.
v3.3: ONIKIT, LUMILAMB, TERRATORT, ZEPHERRET, CINDERWREN, RIMEFOX, TIDOTTER, UMBRAVEN, JOLTAROO and MANTIBOT (folders akumaru … tekko) are original creature designs made for this project the same way, each from its own 6-form concept sheet (`design/art-v3.3/<id>/sheet.jpg`).

## Icons
`assets/icons/*` were drawn with Pillow for this project.

## Code
All app code (HTML/CSS/JS, the service worker) was written for this project, with no third-party runtime libraries. Tests use Puppeteer (Apache-2.0) with Google Chrome (headless).
