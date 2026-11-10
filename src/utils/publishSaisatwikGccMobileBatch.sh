#!/usr/bin/env bash
# Push the Nov 2026 GCC Mobile App Development batch (10 posts).
# Default: DRAFT. Pass --publish to make them live (no date field, so WordPress uses "now").
# Covers in src/utils/saisatwik-blogs/covers/<slug>.png are attached automatically.
# Run from the repo root: bash src/utils/publishSaisatwikGccMobileBatch.sh [--publish]
set -e
POSTS="mobile-app-development-company-gcc mobile-app-development-dubai mobile-app-development-saudi-arabia mobile-app-development-qatar ecommerce-app-development-kuwait fintech-app-development-bahrain mobile-app-development-oman arabic-rtl-mobile-app-development mobile-app-data-protection-laws-gcc mobile-app-payment-gateways-gcc"
for s in $POSTS; do npm run --silent create:saisatwik-blog -- "$s" "$@"; done
