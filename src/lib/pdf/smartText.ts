// Detects Arabic/Persian script (U+0600–U+06FF and extended Arabic blocks).
const ARABIC_RE =
  /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷏ﷰ-﷿ﹰ-﻿]/

export function arabicStyle(text: string | null | undefined) {
  if (text && ARABIC_RE.test(text)) {
    return { fontFamily: 'NotoNaskhArabic', textAlign: 'right' as const }
  }
  return {}
}
