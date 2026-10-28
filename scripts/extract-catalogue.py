#!/usr/bin/env python3
"""Extract the original embedded product JPEGs from the supplied catalogue.

No images are recreated or retouched. A contextual logo clip is rendered from
page 1 only; the contact details on the back cover are never exported.
"""
from __future__ import annotations
import json
from pathlib import Path
import re
import sys
import fitz

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path('/workspace/attachments/84a75092-b56d-4882-a945-57b5d9a51c42/Doce_Pé_Julho 2026br.pdf')
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PDF
OUTPUT = ROOT / 'public' / 'catalogo'
OUTPUT.mkdir(parents=True, exist_ok=True)
SELECTION = [
    (3, '152-22'), (3, '153-464'), (4, '154-09'), (5, '157-257'),
    (6, '4290-22'), (7, '4293-01'), (8, '4295-390'), (9, '8151-22'),
    (12, '1085-20'), (12, '1086-257'), (13, '1088-09'), (14, '1090-390'),
    (15, '9075-464'), (16, '9076-257'), (18, '9080-1105'), (20, '26032-1123'),
]
CATEGORIES = {
    'SAPATINHO BABY': ('Sapatinhos baby', 'Sapatinho baby'),
    'SAPATILHA': ('Sapatilhas', 'Sapatilha'),
    'SANDÁLIA BABY': ('Sandálias baby', 'Sandália baby'),
    'SANDÁLIA FASHION': ('Sandálias fashion', 'Sandália fashion'),
}

def lines_on(page):
    return [
        (fitz.Rect(line['bbox']), ''.join(span['text'] for span in line['spans']).strip())
        for block in page.get_text('dict')['blocks']
        for line in block.get('lines', [])
        if ''.join(span['text'] for span in line['spans']).strip()
    ]

with fitz.open(PDF) as document:
    products = []
    provenance = []
    for number, reference in SELECTION:
        page = document[number - 1]
        lines = lines_on(page)
        label = next(box for box, text in lines if text == reference)
        colors = [
            (box, text) for box, text in lines
            if abs(box.x0 - label.x0) < 22 and 5 <= box.y0 - label.y0 < 20
        ]
        assert len(colors) == 1, (reference, colors)
        color = colors[0][1]
        page_text = page.get_text()
        size = re.search(r'\b(\d{2}) ao (\d{2})\b', page_text)
        assert size, reference
        category_text = next(value for value in CATEGORIES if value in page_text)
        category, singular = CATEGORIES[category_text]
        images = [
            image for image in page.get_image_info(xrefs=True)
            if 250 <= image['width'] <= 500
        ]
        candidates = []
        for image in images:
            box = fitz.Rect(image['bbox'])
            if box.x0 - 25 <= label.x0 <= box.x1 - 10 and box.y0 < label.y0 <= box.y1 + 20:
                score = abs(box.x0 - label.x0) + 2 * abs(box.y1 - (label.y1 + 9))
                candidates.append((score, image))
        assert candidates, reference
        _, image = min(candidates, key=lambda candidate: candidate[0])
        raw = document.extract_image(image['xref'])
        filename = f'{reference}.{raw["ext"]}'
        (OUTPUT / filename).write_bytes(raw['image'])
        products.append({
            'id': reference,
            'reference': reference,
            'name': f'{singular} {reference.split("-")[0]}',
            'category': category,
            'color': color,
            'sizes': f'{size[1]} ao {size[2]}',
            'image': f'/catalogo/{filename}',
            'page': number,
            'brand': 'Doce Pé',
        })
        provenance.append({
            'reference': reference,
            'page': number,
            'xref': image['xref'],
            'image_bbox': [round(value, 2) for value in image['bbox']],
            'caption_bbox': [round(value, 2) for value in label],
            'dimensions': [raw['width'], raw['height']],
            'extraction': 'original embedded image bytes',
        })
    logo = document.extract_image(238)
    (OUTPUT / f'logo-doce-pe.{logo["ext"]}').write_bytes(logo['image'])
    frame = document.extract_image(244)
    (OUTPUT / 'moldura-doces.jpg').write_bytes(frame['image'])
    cover = document.extract_image(1603)
    (OUTPUT / f'capa-primavera-verao.{cover["ext"]}').write_bytes(cover['image'])
    # This logo only exists as part of the cover raster; preserve its context.
    document[0].get_pixmap(matrix=fitz.Matrix(2, 2), clip=fitz.Rect(143, 586, 480, 786)).save(OUTPUT / 'logo-peknin-contexto.png')
    (OUTPUT / 'products.json').write_text(json.dumps(products, ensure_ascii=False, indent=2) + '\n')
    (OUTPUT / 'provenance.json').write_text(json.dumps({
        'source': PDF.name,
        'source_pages': 22,
        'source_period': 'Julho 2026',
        'collection_label': 'Primavera • Verão',
        'product_photo_policy': 'Only original embedded images extracted, without retouching.',
        'logo_note': 'Doce Pé has a separate embedded image; Peknin is a contextual clip from the front cover, with its original background.',
        'contact_note': 'Back-cover contact details were not exported. Use the phone supplied by the user, +55 11 94275-6602.',
        'availability_note': 'Catalogue sizes and colors do not establish current availability. No prices are present in this selection.',
        'products': provenance,
    }, ensure_ascii=False, indent=2) + '\n')
print(f'{len(products)} product images extracted to {OUTPUT}')
for product, source in zip(products, provenance):
    print(product['reference'], product['color'], product['sizes'], f'p{product["page"]}', 'xref'+str(source['xref']))
