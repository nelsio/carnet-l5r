"""Régénère le masque SVG --enso (HANDOFF annexe I.2). Python 3, sans dépendance.

Modifier thick() pour changer le caractère du trait ; garder R constant pour que le cercle reste rond.
"""
import math
from urllib.parse import quote

def pt(r, a): return (50 + r*math.cos(a), 50 - r*math.sin(a))

def band(a0, span, rad, thick, n=120):
    out, inn = [], []
    for i in range(n + 1):
        s = i / n; a = math.radians(a0 + span*s); r = rad(s); t = thick(s)
        out.append(pt(r + t/2, a)); inn.append(pt(r - t/2, a))
    return 'M' + ' '.join(f'{x:.1f} {y:.1f}' for x, y in out + inn[::-1]) + 'Z'

A0, SPAN = 58, 318            # départ en haut à droite, 318° anti-horaire
R = lambda s: 42.0            # rayon constant : cercle bien rond

def thick(s):                 # épaisseur du trait le long du tracé (s de 0 à 1)
    attack = min(1, s/0.06)**0.7
    body = 9.5 - 4.5*s + 1.6*math.sin(5.5*math.pi*s)
    tail = min(1, (1 - s)/0.22)**1.3
    return max(0.6, 1.2 + body*attack*tail)

paths = [band(A0, SPAN, R, thick)]
for dr, ln, w in [(-3.2, .10, 1.0), (2.6, .14, .9), (.4, .07, .7)]:   # poils secs
    paths.append(band(A0 + SPAN*.8, SPAN*(.2 + ln), lambda s, dr=dr: 42 + dr,
                      lambda s, w=w: w*(1 - s)**.8 + .15, 40))
svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"
       f"<path d='{''.join(paths)}'/></svg>")
print('url("data:image/svg+xml,' + quote(svg, safe="/:='. -") + '")')
