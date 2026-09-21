"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { Button } from "../components/ui/button"
import Link from "next/link"

interface Artwork {
  id: string
  title: string
  year: string
  medium: string
  statement: string
  mediaUrl: string
  mediaType: "image" | "video"
}

interface CvItem {
  id: string
  year: string
  degree?: string
  school?: string
  title?: string
  venue?: string
  program?: string
  organization?: string
  location?: string
}

export default function PublicPortfolioPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // CV 狀態
  const [educations, setEducations] = useState<CvItem[]>([])
  const [soloExhibits, setSoloExhibits] = useState<CvItem[]>([])
  const [groupExhibits, setGroupExhibits] = useState<CvItem[]>([])
  const [residencies, setResidencies] = useState<CvItem[]>([])
  const [awards, setAwards] = useState<CvItem[]>([])
  const [grants, setGrants] = useState<CvItem[]>([])

  useEffect(() => {
    const fetchPublicData = async () => {
      const { data: profiles } = await supabase.from('profiles').select('*').limit(1)
      if (profiles && profiles.length > 0) {
        const p = profiles[0]
        setProfile(p)
        try {
          if (p.artworks) setArtworks(JSON.parse(p.artworks))
          if (p.education) setEducations(JSON.parse(p.education))
          if (p.solo_exhibitions) setSoloExhibits(JSON.parse(p.solo_exhibitions))
          if (p.group_exhibitions) setGroupExhibits(JSON.parse(p.group_exhibitions))
          if (p.residencies) setResidencies(JSON.parse(p.residencies))
          if (p.awards) setAwards(JSON.parse(p.awards))
          if (p.grants) setGrants(JSON.parse(p.grants))
        } catch (e) {
          console.error(e)
        }
      }
    }
    fetchPublicData()
  }, [])

  const filteredArtworks = artworks.filter(art => 
    art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.medium.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.statement.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedArtworks = [...filteredArtworks].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0))

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans px-4 py-8 md:p-16">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* 頂部導覽與身分 (手機排版優化：上下堆疊) */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {profile ? `${profile.first_name || ''} ${profile.last_name || ''}` : "賴昱汝 | 藝術與實踐"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{profile?.role || "當代藝術家"}</p>
            {profile?.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-1 block">
                {profile.portfolio_url}
              </a>
            )}
          </div>
          <Link href="/auth">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">後台管理登入</Button>
          </Link>
        </header>

        {/* 🔍 手機友善搜尋列 */}
        <div className="space-y-2">
          <input 
            type="text"
            placeholder="搜尋作品名稱、媒材或關鍵字..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm shadow-sm"
          />
        </div>

        {/* 公開作品集網格 (手機單欄、平板以上雙欄) */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold tracking-tight border-b pb-2">Portfolio Archive</h2>
          {sortedArtworks.length === 0 ? (
            <p className="text-gray-400 text-sm italic">目前尚無公開作品。</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {sortedArtworks.map((art) => (
                <div 
                  key={art.id}
                  onClick={() => setSelectedArtwork(art)}
                  className="border rounded-xl overflow-hidden bg-gray-50/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  {art.mediaUrl && art.mediaType === "image" && (
                    <img src={art.mediaUrl} alt={art.title} className="w-full h-48 object-cover border-b bg-black" />
                  )}
                  {art.mediaUrl && art.mediaType === "video" && (
                    <div className="w-full h-48 bg-black text-white flex items-center justify-center font-bold text-xs">🎬 影片作品</div>
                  )}
                  <div className="p-4 space-y-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 text-sm">{art.title}</h3>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">{art.year}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{art.medium}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 公開 CV 簡要展示區 */}
        <section className="space-y-8 pt-4">
          <h2 className="text-lg font-bold tracking-tight border-b pb-2">Artist CV</h2>
          
          {educations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Education</h3>
              <ul className="space-y-1 text-sm">
                {educations.map(item => (
                  <li key={item.id} className="text-gray-700">
                    <strong className="text-gray-900">{item.year}</strong> | {item.school} - {item.degree} ({item.location})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {soloExhibits.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Solo Exhibitions</h3>
              <ul className="space-y-1 text-sm">
                {soloExhibits.map(item => (
                  <li key={item.id} className="text-gray-700">
                    <strong className="text-gray-900">{item.year}</strong> | 「{item.title}」，{item.venue}，{item.location}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {groupExhibits.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Group Exhibitions</h3>
              <ul className="space-y-1 text-sm">
                {groupExhibits.map(item => (
                  <li key={item.id} className="text-gray-700">
                    <strong className="text-gray-900">{item.year}</strong> | 「{item.title}」，{item.venue}，{item.location}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 手機友善燈箱 (LightBox Detail View) */}
        {selectedArtwork && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white text-gray-900 max-w-lg w-full p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-bold">{selectedArtwork.title} ({selectedArtwork.year})</h3>
                <button onClick={() => setSelectedArtwork(null)} className="text-gray-400 hover:text-gray-900 font-bold text-lg px-2">✕</button>
              </div>
              {selectedArtwork.mediaUrl && (
                <div className="rounded-lg overflow-hidden bg-black flex justify-center max-h-[300px]">
                  {selectedArtwork.mediaType === "image" ? (
                    <img src={selectedArtwork.mediaUrl} alt={selectedArtwork.title} className="max-h-[300px] object-contain" />
                  ) : (
                    <video src={selectedArtwork.mediaUrl} controls className="max-h-[300px] w-full" />
                  )}
                </div>
              )}
              <div>
                <span className="text-xs text-gray-400 font-mono">使用媒材：</span>
                <p className="text-sm font-medium">{selectedArtwork.medium}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-mono">創作論述：</span>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mt-1 leading-relaxed whitespace-pre-wrap">{selectedArtwork.statement}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}