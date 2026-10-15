# Créatures du laboratoire de design — provenance

Usage : **prototype de design uniquement** (routes `/fr/lab`, PR brouillon #24). Aucune publication officielle.

## Origine
- Images fournies dans la conversation de conception le **14 octobre 2026** par la personne porteuse du projet,
  présentées comme ses propres créations (« mes créatures, créées par moi »).
- Outil de création, licence et droits d'usage commercial : **non précisés — à confirmer**.
- Règle du projet toujours en vigueur : *pas de créatures générées par IA dans l'application publique*,
  tant qu'elle n'a pas été explicitement réexaminée. L'usage en prototype ne règle pas la question des droits.

## Originaux (intacts, `originals/`)
| Fichier | Famille | Nom provisoire | SHA-256 (début) |
|---|---|---|---|
| leaf-a.png | Feuille | Mossy (variante A) | 28c413a977508747 |
| leaf-b.png | Feuille | Mossy (variante B) | b83b7a88fea7fed4 |
| water-a.png | Eau | Perline (variante A) | 8fa413affeeb6203 |
| water-b.png | Eau | Perline (variante B) | 7622a305c1aca6a6 |
| flower.png | Fleur | Floréa | 91feb96862495f71 |
| air.png | Air | Zéphyr | 7b930cee75fbce6d |
| forest.png | Forêt | Mycélio | e36871c18e511dc4 |
| lunar.png | Lunaire | Lumo | 285adce4df3a089d |
| solar.png | Solaire | Soléa | 7f82cd4c46e3f62b |
| families-lineup.png | — | planche des sept familles | 7dfbbe21f560ab76 |

Format d'origine : PNG RVB 1122 × 1402 (planche : 1536 × 1024), fond crème, sans transparence.

## Copies utilisées sur mobile (`public/lab/creatures/`)
- `*-framed.webp` : image d'origine réduite à 720 px de large (planche : 1200 px), WebP qualité 86.
- `*.webp` : copie **détourée** (WebP avec transparence, 720 px) — détourage automatique et prudent :
  croissance de région depuis les bords à travers des dégradés doux uniquement (fond + ombres portées),
  fond → transparent, ombres → noir translucide, reflets plus clairs que le fond → retirés.
  Réglage : écart entre voisins ≤ 4 (≤ 2 pour `water-a`), écart au fond ≤ 70.
- Limites connues : l'intérieur des bulles enfermées garde la teinte claire d'origine ; quelques bords
  clairs peuvent rester visibles sur fond nuit ; les halos lumineux qui débordent sur le fond sont atténués.
