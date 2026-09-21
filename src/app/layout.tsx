import "./globals.css"

export const metadata = {
  title: 'Praxart | 當代藝術家與實踐平台',
  description: '專業的藝術家履歷管理、作品集庫與專案企劃平台，支援跨裝置瀏覽與作品檢索。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}