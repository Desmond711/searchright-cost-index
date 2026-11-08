#!/usr/bin/env bash
# Fill in the GitHub username everywhere it is still a placeholder.
#
#   ./set-owner.sh <github-username>
#
# Rewrites <GITHUB-USER> in this repository and in the apd-core submission
# bundle beside it. Run once, immediately after the repository is created on
# GitHub and before the first push or the pull request.
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "usage: $0 <github-username>" >&2
  exit 1
fi

USER_NAME="$1"
case "$USER_NAME" in
  *[!A-Za-z0-9-]*|"")
    echo "error: '$USER_NAME' does not look like a GitHub username" >&2
    exit 1
    ;;
esac

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE="$HERE/../research/apd-core-bundle"

targets=(
  "$HERE/README.md"
  "$HERE/CITATION.cff"
)
if [ -d "$BUNDLE" ]; then
  targets+=(
    "$BUNDLE/README.md"
    "$BUNDLE/CITATION.cff"
    "$BUNDLE/PR-BODY.md"
    "$BUNDLE/entry/Search-Right-Home-Service-Cost-Index.yml"
  )
fi

for f in "${targets[@]}"; do
  [ -f "$f" ] || continue
  sed -i "s|<GITHUB-USER>|$USER_NAME|g" "$f"
  echo "updated $f"
done

echo
echo "Remaining placeholders (should be none):"
grep -rn "<GITHUB-USER>" "$HERE" "$BUNDLE" 2>/dev/null | grep -v "set-owner.sh" || echo "  none"
