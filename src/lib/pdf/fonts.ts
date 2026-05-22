import { Font } from '@react-pdf/renderer'
import path from 'path'

let registered = false

export function registerPDFFonts() {
  if (registered) return
  registered = true
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  Font.register({
    family: 'NotoSans',
    fonts: [
      { src: path.join(fontsDir, 'NotoSans-Regular.ttf'), fontWeight: 'normal' },
      { src: path.join(fontsDir, 'NotoSans-Bold.ttf'), fontWeight: 'bold' },
    ],
  })
}
