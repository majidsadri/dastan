#!/bin/bash
# Optimize painting images for web delivery
# Resizes images wider than MAX_WIDTH and compresses JPEG quality
# Uses macOS `sips` (no ImageMagick needed)

COLLECTION_DIR="${1:-/Users/sizarta/dastan/paintings-collection}"
MAX_WIDTH=1600
QUALITY=80  # JPEG quality (0-100)

echo "Optimizing paintings in: $COLLECTION_DIR"
echo "Max width: ${MAX_WIDTH}px, JPEG quality: ${QUALITY}"
echo ""

total=0
resized=0
saved_bytes=0

while IFS= read -r img; do
  total=$((total + 1))

  width=$(sips -g pixelWidth "$img" 2>/dev/null | awk '/pixelWidth/{print $2}')
  size_before=$(stat -f "%z" "$img" 2>/dev/null)

  if [ -z "$width" ]; then
    continue
  fi

  if [ "$width" -gt "$MAX_WIDTH" ]; then
    # Resize to max width (preserves aspect ratio)
    sips --resampleWidth "$MAX_WIDTH" -s formatOptions "$QUALITY" "$img" >/dev/null 2>&1
    resized=$((resized + 1))

    size_after=$(stat -f "%z" "$img" 2>/dev/null)
    diff=$((size_before - size_after))
    saved_bytes=$((saved_bytes + diff))

    if [ $((total % 50)) -eq 0 ]; then
      echo "  Processed $total images ($resized resized)..."
    fi
  fi
done < <(find "$COLLECTION_DIR" -name "*.jpg" -type f)

saved_mb=$((saved_bytes / 1024 / 1024))
echo ""
echo "Done!"
echo "  Total images: $total"
echo "  Resized: $resized"
echo "  Space saved: ~${saved_mb} MB"
