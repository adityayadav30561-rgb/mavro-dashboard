#!/usr/bin/env bash
# Publish the Nov 2026 GCC batch (10 posts) + 3 retro-linked EPPM posts, then
# attach every cover found in src/utils/saisatwik-blogs/covers/.
# Run from the repo root: bash src/utils/publishSaisatwikGccBatch.sh
set -e
NEW="sap-eppm-implementation-partner-middle-east sap-ps-implementation-uae sap-ps-for-construction-saudi-arabia sap-eppm-for-oil-and-gas-uae sap-eppm-public-sector-saudi-arabia sap-ps-implementation-qatar sap-ps-implementation-kuwait sap-eppm-implementation-oman sap-eppm-partner-bahrain project-controls-for-gulf-giga-projects"
RETRO="what-is-sap-eppm-and-why-top-enterprises-are-switching-to-it why-saudi-enterprises-are-adopting-sap-eppm-for-large-project-portfolios why-enterprises-are-investing-in-sap-eppm-enterprise-portfolio-and-project-management-in-2026"
for s in $NEW $RETRO; do npm run --silent create:saisatwik-blog -- "$s" --publish; done
# Covers for posts that already exist (new posts pick theirs up above).
for f in src/utils/saisatwik-blogs/covers/*.{png,jpg,jpeg,webp}; do
  [ -e "$f" ] || continue
  s=$(basename "${f%.*}")
  case " $NEW " in *" $s "*) continue;; esac
  npm run --silent create:saisatwik-blog -- "$s" --cover-only
done
