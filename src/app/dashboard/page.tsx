"use client"

import { useEffect, useState } from "react" 
import { useRouter } from "next/navigation" 
import { supabase } from "../../lib/supabase" 
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"

// --- 型別定義 (TypeScript Interfaces) ---
interface CvEducation { id: string; year: string; degree: string; school: string; location: string }
interface CvExhibition { id: string; year: string; title: string; venue: string; location: string }
interface CvResidency { id: string; year: string; program: string; location: string }
interface CvHonor { id: string; year: string; title: string; organization: string }
interface Artwork { id: string; title: string; year: string; medium: string; statement: string; mediaUrl: string; mediaType: "image" | "video" }
interface ProjectExhibition { id: string; title: string; statement: string }
interface ProjectCreation { id: string; title: string; medium: string; statement: string }

export default function DashboardPage() {
  const router = useRouter()
  
  const [userEmail, setUserEmail] = useState("載入中...")
  const [userId, setUserId] = useState<string | null>(null)
  
  // 主分頁切換：profile (基本資料), cv (藝術家CV), portfolio (作品集), exhibition (專案管理)
  const [activeTab, setActiveTab] = useState("profile") 
  const [projectTab, setProjectTab] = useState<"exhibition" | "creation">("exhibition")
  
  // 1. 基本資料狀態
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState("")
  const [portfolioUrl, setPortfolioUrl] = useState("")
  
  // 2. 結構化 CV 狀態
  const [educations, setEducations] = useState<CvEducation[]>([])
  const [soloExhibits, setSoloExhibits] = useState<CvExhibition[]>([])
  const [groupExhibits, setGroupExhibits] = useState<CvExhibition[]>([])
  const [residencies, setResidencies] = useState<CvResidency[]>([])
  const [awards, setAwards] = useState<CvHonor[]>([])
  const [grants, setGrants] = useState<CvHonor[]>([])

  // CV 暫存輸入狀態
  const [eduYear, setEduYear] = useState(""); const [eduDegree, setEduDegree] = useState(""); const [eduSchool, setEduSchool] = useState(""); const [eduLocation, setEduLocation] = useState("")
  const [soloYear, setSoloYear] = useState(""); const [soloTitle, setSoloTitle] = useState(""); const [soloVenue, setSoloVenue] = useState(""); const [soloLocation, setSoloLocation] = useState("")
  const [groupYear, setGroupYear] = useState(""); const [groupTitle, setGroupTitle] = useState(""); const [groupVenue, setGroupVenue] = useState(""); const [groupLocation, setGroupLocation] = useState("")
  const [resYear, setResYear] = useState(""); const [resProgram, setResProgram] = useState(""); const [resLocation, setResLocation] = useState("")
  const [awardYear, setAwardYear] = useState(""); const [awardTitle, setAwardTitle] = useState(""); const [awardOrg, setAwardOrg] = useState("")
  const [grantYear, setGrantYear] = useState(""); const [grantTitle, setGrantTitle] = useState(""); const [grantOrg, setGrantOrg] = useState("")

  // 3. 作品集狀態
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newYear, setNewYear] = useState("")
  const [newMedium, setNewMedium] = useState("")
  const [newStatement, setNewStatement] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // 4. 專案管理狀態 (展覽企劃 / 創作提案)
  const [projectExhibitions, setProjectExhibitions] = useState<ProjectExhibition[]>([])
  const [projectCreations, setProjectCreations] = useState<ProjectCreation[]>([])
  const [selectedProjectEx, setSelectedProjectEx] = useState<ProjectExhibition | null>(null)
  const [selectedProjectCr, setSelectedProjectCr] = useState<ProjectCreation | null>(null)

  const [projExTitle, setProjExTitle] = useState("")
  const [projExStatement, setProjExStatement] = useState("")
  const [projCrTitle, setProjCrTitle] = useState("")
  const [projCrMedium, setProjCrMedium] = useState("")
  const [projCrStatement, setProjCrStatement] = useState("")

  // 通用系統狀態
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  // 初始化與資料載入
  useEffect(() => {
    const checkUserAndFetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth")
        return
      } 
      setUserEmail(session.user.email || "")
      setUserId(session.user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setFirstName(profile.first_name || "")
        setLastName(profile.last_name || "")
        setRole(profile.role || "")
        setPortfolioUrl(profile.portfolio_url || "")
        
        try {
          if (profile.education) setEducations(JSON.parse(profile.education))
          if (profile.solo_exhibitions) setSoloExhibits(JSON.parse(profile.solo_exhibitions))
          if (profile.group_exhibitions) setGroupExhibits(JSON.parse(profile.group_exhibitions))
          if (profile.residencies) setResidencies(JSON.parse(profile.residencies))
          if (profile.awards) setAwards(JSON.parse(profile.awards))
          if (profile.grants) setGrants(JSON.parse(profile.grants))
          if (profile.artworks) setArtworks(JSON.parse(profile.artworks))
          if (profile.project_exhibitions) setProjectExhibitions(JSON.parse(profile.project_exhibitions))
          if (profile.project_creations) setProjectCreations(JSON.parse(profile.project_creations))
        } catch (e) {
          console.error("解析資料庫 JSON 發生錯誤", e)
        }
      }
    }
    checkUserAndFetchProfile()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth")
  }

  // 統一資料同步至 Supabase
  const handleSaveAll = async () => {
    if (!userId) return
    setIsSaving(true)
    setSaveMessage("⏳ 正在同步至雲端資料庫...")

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        role: role,
        portfolio_url: portfolioUrl,
        education: JSON.stringify(educations),
        solo_exhibitions: JSON.stringify(soloExhibits),
        group_exhibitions: JSON.stringify(groupExhibits),
        residencies: JSON.stringify(residencies),
        awards: JSON.stringify(awards),
        grants: JSON.stringify(grants),
        artworks: JSON.stringify(artworks),
        project_exhibitions: JSON.stringify(projectExhibitions),
        project_creations: JSON.stringify(projectCreations),
      })

    if (error) {
      setSaveMessage(`❌ 儲存失敗: ${error.message}`)
    } else {
      setSaveMessage("✅ 所有架構資料與檔案已成功完成雲端同步！")
    }
    setIsSaving(false)
  }

  // CV 新增輔助函式
  const addEducation = () => { if (!eduSchool.trim()) return; setEducations([...educations, { id: Date.now().toString(), year: eduYear, degree: eduDegree, school: eduSchool, location: eduLocation }]); setEduYear(""); setEduDegree(""); setEduSchool(""); setEduLocation("") }
  const addSolo = () => { if (!soloTitle.trim()) return; setSoloExhibits([...soloExhibits, { id: Date.now().toString(), year: soloYear, title: soloTitle, venue: soloVenue, location: soloLocation }]); setSoloYear(""); setSoloTitle(""); setSoloVenue(""); setSoloLocation("") }
  const addGroup = () => { if (!groupTitle.trim()) return; setGroupExhibits([...groupExhibits, { id: Date.now().toString(), year: groupYear, title: groupTitle, venue: groupVenue, location: groupLocation }]); setGroupYear(""); setGroupTitle(""); setGroupVenue(""); setGroupLocation("") }
  const addResidency = () => { if (!resProgram.trim()) return; setResidencies([...residencies, { id: Date.now().toString(), year: resYear, program: resProgram, location: resLocation }]); setResYear(""); setResProgram(""); setResLocation("") }
  const addAward = () => { if (!awardTitle.trim()) return; setAwards([...awards, { id: Date.now().toString(), year: awardYear, title: awardTitle, organization: awardOrg }]); setAwardYear(""); setAwardTitle(""); setAwardOrg("") }
  const addGrant = () => { if (!grantTitle.trim()) return; setGrants([...grants, { id: Date.now().toString(), year: grantYear, title: grantTitle, organization: grantOrg }]); setGrantYear(""); setGrantTitle(""); setGrantOrg("") }

  // 作品集上傳與新增
  const handleAddArtworkWithUpload = async () => {
    if (!newTitle.trim()) return
    setIsUploading(true)
    let mediaUrl = ""
    let mediaType: "image" | "video" = "image"

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image'

        const { error: uploadError } = await supabase.storage.from('artworks').upload(fileName, selectedFile)
        if (uploadError) { alert(`上傳失敗: ${uploadError.message}`); setIsUploading(false); return }

        const { data: publicData } = supabase.storage.from('artworks').getPublicUrl(fileName)
        mediaUrl = publicData.publicUrl
      }

      setArtworks([...artworks, { id: Date.now().toString(), title: newTitle, year: newYear, medium: newMedium, statement: newStatement, mediaUrl, mediaType }])
      setNewTitle(""); setNewYear(""); setNewMedium(""); setNewStatement(""); setSelectedFile(null)
    } catch (err) {
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  // 專案管理新增
  const addProjectExhibition = () => { if (!projExTitle.trim()) return; setProjectExhibitions([...projectExhibitions, { id: Date.now().toString(), title: projExTitle, statement: projExStatement }]); setProjExTitle(""); setProjExStatement("") }
  const addProjectCreation = () => { if (!projCrTitle.trim()) return; setProjectCreations([...projectCreations, { id: Date.now().toString(), title: projCrTitle, medium: projCrMedium, statement: projCrStatement }]); setProjCrTitle(""); setProjCrMedium(""); setProjCrStatement("") }

  const sortedArtworks = [...artworks].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0))

  return (
    <div className="min-h-screen bg-gray-50/70 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/*頂部導覽列 Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-gray-200 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">Praxart OS</span>
              <span className="text-xs text-gray-500 font-medium">當代藝術行政與實踐中樞</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mt-2">藝術家專業會員中心</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleSaveAll} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              {isSaving ? "⏳ 同步中..." : "💾 儲存所有變更"}
            </Button>
            <Button variant="outline" onClick={handleLogout} className="text-gray-700">登出</Button>
          </div>
        </header>

        {saveMessage && (
          <div className={`p-4 rounded-lg text-sm font-medium shadow-sm ${saveMessage.includes('❌') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
            {saveMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* 左側主導覽選單 (Sidebar) */}
          <div className="md:col-span-1 space-y-4">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Workspace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-0">
                <Button 
                  variant={activeTab === "profile" ? "secondary" : "ghost"} 
                  className={`w-full justify-start font-medium ${activeTab === "profile" ? "text-blue-600 bg-blue-50/80 font-semibold" : "text-gray-600"}`}
                  onClick={() => setActiveTab("profile")}
                >
                  👤 基本資料設定
                </Button>
                <Button 
                  variant={activeTab === "cv" ? "secondary" : "ghost"} 
                  className={`w-full justify-start font-medium ${activeTab === "cv" ? "text-blue-600 bg-blue-50/80 font-semibold" : "text-gray-600"}`}
                  onClick={() => setActiveTab("cv")}
                >
                  🎨 藝術家 CV 與經歷
                </Button>
                <Button 
                  variant={activeTab === "portfolio" ? "secondary" : "ghost"} 
                  className={`w-full justify-start font-medium ${activeTab === "portfolio" ? "text-blue-600 bg-blue-50/80 font-semibold" : "text-gray-600"}`}
                  onClick={() => setActiveTab("portfolio")}
                >
                  🖼️ 個人作品集管理
                </Button>
                <Button 
                  variant={activeTab === "exhibition" ? "secondary" : "ghost"} 
                  className={`w-full justify-start font-medium ${activeTab === "exhibition" ? "text-blue-600 bg-blue-50/80 font-semibold" : "text-gray-600"}`}
                  onClick={() => setActiveTab("exhibition")}
                >
                  📁 專案管理
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 truncate font-mono bg-gray-50 p-2.5 rounded border border-gray-100">{userEmail}</p>
              </CardContent>
            </Card>
          </div>

          {/* 右側核心工作區 (Main Content Area) */}
          <div className="md:col-span-3 space-y-6">
            
            {/* 1. 基本資料設定 */}
            {activeTab === "profile" && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-xl">個人基本資料</CardTitle>
                  <CardDescription>管理您的真實姓名、專業身分與公開個人網站連結。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>名字 (First Name)</Label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="例如：昱汝" />
                    </div>
                    <div className="space-y-2">
                      <Label>姓氏 (Last Name)</Label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="例如：賴" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>主要專業身份 (Role / Title)</Label>
                      <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="例如：當代藝術家 / 獨立策展人" />
                  </div>
                  <div className="space-y-2">
                    <Label>個人網站 / 作品集連結 (Portfolio URL)</Label>
                    <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://..." />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 2. 藝術家 CV 與經歷 */}
            {activeTab === "cv" && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-xl">藝術家履歷與經歷 (Artist CV)</CardTitle>
                  <CardDescription>模組化結構管理，確保投遞審查時的排版規格統一。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-10">
                  
                  {/* 學歷 */}
                  <div className="space-y-4 border-b pb-6">
                    <h3 className="font-semibold text-gray-900 text-base">1. 基本資料與學歷 (Education)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <Input placeholder="年份 (例: 2026)" value={eduYear} onChange={(e) => setEduYear(e.target.value)} />
                      <Input placeholder="學位/科系" value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} />
                      <Input placeholder="學校名稱" value={eduSchool} onChange={(e) => setEduSchool(e.target.value)} />
                      <Input placeholder="地點" value={eduLocation} onChange={(e) => setEduLocation(e.target.value)} />
                    </div>
                    <Button onClick={addEducation} size="sm" variant="outline">＋ 新增學歷</Button>
                    <div className="space-y-2 mt-2">
                      {educations.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50/80 p-3 rounded-lg border border-gray-100 text-sm">
                          <span><strong>{item.year}</strong> | {item.school} - {item.degree} ({item.location})</span>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7" onClick={() => setEducations(educations.filter(x => x.id !== item.id))}>刪除</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 個展 */}
                  <div className="space-y-4 border-b pb-6">
                    <h3 className="font-semibold text-gray-900 text-base">2. 個展經歷 (Solo Exhibitions)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <Input placeholder="年份" value={soloYear} onChange={(e) => setSoloYear(e.target.value)} />
                      <Input placeholder="展覽名稱" value={soloTitle} onChange={(e) => setSoloTitle(e.target.value)} />
                      <Input placeholder="展覽空間/畫廊" value={soloVenue} onChange={(e) => setSoloVenue(e.target.value)} />
                      <Input placeholder="地點" value={soloLocation} onChange={(e) => setSoloLocation(e.target.value)} />
                    </div>
                    <Button onClick={addSolo} size="sm" variant="outline">＋ 新增個展</Button>
                    <div className="space-y-2 mt-2">
                      {soloExhibits.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50/80 p-3 rounded-lg border border-gray-100 text-sm">
                          <span><strong>{item.year}</strong> | 「{item.title}」，{item.venue}，{item.location}</span>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7" onClick={() => setSoloExhibits(soloExhibits.filter(x => x.id !== item.id))}>刪除</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 聯展 */}
                  <div className="space-y-4 border-b pb-6">
                    <h3 className="font-semibold text-gray-900 text-base">3. 聯展經歷 (Group Exhibitions)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <Input placeholder="年份" value={groupYear} onChange={(e) => setGroupYear(e.target.value)} />
                      <Input placeholder="展覽名稱" value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} />
                      <Input placeholder="展覽空間/機構" value={groupVenue} onChange={(e) => setGroupVenue(e.target.value)} />
                      <Input placeholder="地點" value={groupLocation} onChange={(e) => setGroupLocation(e.target.value)} />
                    </div>
                    <Button onClick={addGroup} size="sm" variant="outline">＋ 新增聯展</Button>
                    <div className="space-y-2 mt-2">
                      {groupExhibits.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50/80 p-3 rounded-lg border border-gray-100 text-sm">
                          <span><strong>{item.year}</strong> | 「{item.title}」，{item.venue}，{item.location}</span>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7" onClick={() => setGroupExhibits(groupExhibits.filter(x => x.id !== item.id))}>刪除</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 藝術駐村 */}
                  <div className="space-y-4 border-b pb-6">
                    <h3 className="font-semibold text-gray-900 text-base">4. 藝術駐村 (Art Residencies)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input placeholder="年份" value={resYear} onChange={(e) => setResYear(e.target.value)} />
                      <Input placeholder="駐村計畫/單位名稱" value={resProgram} onChange={(e) => setResProgram(e.target.value)} />
                      <Input placeholder="地點" value={resLocation} onChange={(e) => setResLocation(e.target.value)} />
                    </div>
                    <Button onClick={addResidency} size="sm" variant="outline">＋ 新增駐村</Button>
                    <div className="space-y-2 mt-2">
                      {residencies.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50/80 p-3 rounded-lg border border-gray-100 text-sm">
                          <span><strong>{item.year}</strong> | {item.program}，{item.location}</span>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7" onClick={() => setResidencies(residencies.filter(x => x.id !== item.id))}>刪除</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 得獎紀錄 */}
                  <div className="space-y-4 border-b pb-6">
                    <h3 className="font-semibold text-gray-900 text-base">5. 得獎紀錄 (Awards)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input placeholder="年份" value={awardYear} onChange={(e) => setAwardYear(e.target.value)} />
                      <Input placeholder="獎項名稱" value={awardTitle} onChange={(e) => setAwardTitle(e.target.value)} />
                      <Input placeholder="主辦單位" value={awardOrg} onChange={(e) => setAwardOrg(e.target.value)} />
                    </div>
                    <Button onClick={addAward} size="sm" variant="outline">＋ 新增得獎</Button>
                    <div className="space-y-2 mt-2">
                      {awards.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50/80 p-3 rounded-lg border border-gray-100 text-sm">
                          <span><strong>{item.year}</strong> | {item.title}，{item.organization}</span>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7" onClick={() => setAwards(awards.filter(x => x.id !== item.id))}>刪除</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 獎補助 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-base">6. 獎補助 (Grants & Subsidies)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input placeholder="年份" value={grantYear} onChange={(e) => setGrantYear(e.target.value)} />
                      <Input placeholder="補助計畫名稱" value={grantTitle} onChange={(e) => setGrantTitle(e.target.value)} />
                      <Input placeholder="贊助/主管機關" value={grantOrg} onChange={(e) => setGrantOrg(e.target.value)} />
                    </div>
                    <Button onClick={addGrant} size="sm" variant="outline">＋ 新增獎補助</Button>
                    <div className="space-y-2 mt-2">
                      {grants.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50/80 p-3 rounded-lg border border-gray-100 text-sm">
                          <span><strong>{item.year}</strong> | {item.title}，{item.organization}</span>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7" onClick={() => setGrants(grants.filter(x => x.id !== item.id))}>刪除</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* 3. 個人作品集管理 */}
            {activeTab === "portfolio" && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-xl">個人作品集管理 (Portfolio)</CardTitle>
                  <CardDescription>原生上傳圖片與影片，系統自動依年份排序，支援沉浸式檢視。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  
                  {/* 新增作品表單 */}
                  <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-200/80 space-y-4">
                    <h3 className="font-semibold text-sm text-gray-900">➕ 新增一件作品並上傳影音檔案</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">作品名稱 (Title)</Label>
                        <Input placeholder="空間重構系列 I" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">年代 (Year) —— 用於自動排序</Label>
                        <Input placeholder="2026" value={newYear} onChange={(e) => setNewYear(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">媒材與技術 (Medium)</Label>
                      <Input placeholder="木作、壓克力、雷射切割 (Laser Cutting)" value={newMedium} onChange={(e) => setNewMedium(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">上傳圖片/影片檔案 (Image / Video)</Label>
                      <Input 
                        type="file" 
                        accept="image/*,video/*"
                        onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]) }}
                        className="bg-white file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">創作論述 (Statement)</Label>
                      <textarea 
                        className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 min-h-[90px]"
                        placeholder="請書寫該作品的核心概念與脈絡..."
                        value={newStatement}
                        onChange={(e) => setNewStatement(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddArtworkWithUpload} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isUploading}>
                      {isUploading ? "📤 檔案上傳中..." : "將此作品上傳並加入清單"}
                    </Button>
                  </div>

                  {/* 作品清單 */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-900">🎨 已建檔作品清單（依年份自動排序，共 {sortedArtworks.length} 件）</h3>
                    {sortedArtworks.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">目前尚無作品，請透過上方表單新增。</p>
                    ) : (
                      sortedArtworks.map((art) => (
                        <div
                          key={art.id}
                          onClick={() => setSelectedArtwork(art)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                            selectedArtwork?.id === art.id ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {art.mediaUrl && art.mediaType === "image" && (
                              <img src={art.mediaUrl} alt={art.title} className="w-12 h-12 object-cover rounded-lg border" />
                            )}
                            {art.mediaUrl && art.mediaType === "video" && (
                              <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center text-xs rounded-lg font-bold">影片</div>
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{art.title}</span>
                                <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">{art.year}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{art.medium}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-blue-600 font-medium">詳細檢視 🔍</span>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-8" onClick={(e) => { e.stopPropagation(); setArtworks(artworks.filter(x => x.id !== art.id)) }}>刪除</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 作品詳細檢視面板 */}
                  {selectedArtwork && (
                    <div className="bg-gray-900 text-white p-6 rounded-xl space-y-4 shadow-xl">
                      <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                        <div>
                          <span className="text-xs text-blue-400 uppercase tracking-wider font-mono">Artwork Showcase</span>
                          <h3 className="text-xl font-bold mt-1">{selectedArtwork.title} ({selectedArtwork.year})</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setSelectedArtwork(null)}>✕</Button>
                      </div>
                      {selectedArtwork.mediaUrl && (
                        <div className="rounded-lg overflow-hidden bg-black flex justify-center max-h-[400px]">
                          {selectedArtwork.mediaType === "image" ? (
                            <img src={selectedArtwork.mediaUrl} alt={selectedArtwork.title} className="max-h-[400px] object-contain" />
                          ) : (
                            <video src={selectedArtwork.mediaUrl} controls className="max-h-[400px] w-full" />
                          )}
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-gray-400 uppercase font-mono">使用媒材：</span>
                        <p className="font-medium text-sm mt-0.5">{selectedArtwork.medium}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 uppercase font-mono">創作論述：</span>
                        <p className="text-sm text-gray-200 bg-gray-800/80 p-4 rounded-lg mt-1 whitespace-pre-wrap leading-relaxed">{selectedArtwork.statement}</p>
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            )}

            {/* 4. 專案管理 (🏛️ 展覽企劃 / ✨ 創作提案) */}
            {activeTab === "exhibition" && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-xl">專案管理 (Project Management)</CardTitle>
                  <CardDescription>系統化管理您的展覽企劃與創作提案，無上限新增與詳檢。</CardDescription>
                  
                  {/* 子選單切換 */}
                  <div className="flex space-x-2 mt-4 p-1 bg-gray-100 rounded-lg w-fit">
                    <button
                      onClick={() => setProjectTab("exhibition")}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${projectTab === "exhibition" ? "bg-white text-gray-900 shadow-sm font-semibold" : "text-gray-500"}`}
                    >
                      🏛️ 展覽企劃
                    </button>
                    <button
                      onClick={() => setProjectTab("creation")}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${projectTab === "creation" ? "bg-white text-gray-900 shadow-sm font-semibold" : "text-gray-500"}`}
                    >
                      ✨ 創作提案
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-8">
                  
                  {/* 子分頁 A：展覽企劃 */}
                  {projectTab === "exhibition" && (
                    <div className="space-y-6">
                      <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-200/80 space-y-4">
                        <h3 className="font-semibold text-sm text-gray-900">➕ 新增展覽企劃</h3>
                        <div className="space-y-1">
                          <Label className="text-xs">展覽名稱</Label>
                          <Input placeholder="例如：空間重構與當代實踐特展" value={projExTitle} onChange={(e) => setProjExTitle(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">展覽論述</Label>
                          <textarea 
                            className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 min-h-[100px]"
                            placeholder="請書寫展覽核心策展概念與空間動線..."
                            value={projExStatement}
                            onChange={(e) => setProjExStatement(e.target.value)}
                          />
                        </div>
                        <Button onClick={addProjectExhibition} className="w-full" variant="outline">加入展覽企劃清單</Button>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-gray-900">🏛️ 已建檔展覽企劃清單（共 {projectExhibitions.length} 件）</h3>
                        {projectExhibitions.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">目前尚無展覽企劃。</p>
                        ) : (
                          projectExhibitions.map((item) => (
                            <div 
                              key={item.id} 
                              onClick={() => setSelectedProjectEx(item)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                                selectedProjectEx?.id === item.id ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <div>
                                <span className="font-medium text-gray-900">{item.title}</span>
                                <p className="text-xs text-gray-500 mt-1 truncate max-w-md">{item.statement || "無論述"}</p>
                              </div>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-8" onClick={(e) => { e.stopPropagation(); setProjectExhibitions(projectExhibitions.filter(x => x.id !== item.id)) }}>刪除</Button>
                            </div>
                          ))
                        )}
                      </div>

                      {selectedProjectEx && (
                        <div className="bg-gray-900 text-white p-6 rounded-xl space-y-4 shadow-xl">
                          <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                            <h3 className="text-xl font-bold">🏛️ {selectedProjectEx.title}</h3>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setSelectedProjectEx(null)}>✕</Button>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 uppercase font-mono">展覽論述：</span>
                            <p className="text-sm text-gray-200 bg-gray-800/80 p-4 rounded-lg mt-1 whitespace-pre-wrap leading-relaxed">{selectedProjectEx.statement}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 子分頁 B：創作提案 */}
                  {projectTab === "creation" && (
                    <div className="space-y-6">
                      <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-200/80 space-y-4">
                        <h3 className="font-semibold text-sm text-gray-900">➕ 新增創作提案</h3>
                        <div className="space-y-1">
                          <Label className="text-xs">作品名稱</Label>
                          <Input placeholder="例如：無題：邊界與重組系列" value={projCrTitle} onChange={(e) => setProjCrTitle(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">創作媒材</Label>
                          <Input placeholder="例如：木作、壓克力、雷射切割 (Laser Cutting)" value={projCrMedium} onChange={(e) => setProjCrMedium(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">創作論述</Label>
                          <textarea 
                            className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 min-h-[100px]"
                            placeholder="請書寫創作核心脈絡與技術應用計畫..."
                            value={projCrStatement}
                            onChange={(e) => setProjCrStatement(e.target.value)}
                          />
                        </div>
                        <Button onClick={addProjectCreation} className="w-full" variant="outline">加入創作提案清單</Button>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-gray-900">✨ 已建檔創作提案清單（共 {projectCreations.length} 件）</h3>
                        {projectCreations.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">目前尚無創作提案。</p>
                        ) : (
                          projectCreations.map((item) => (
                            <div 
                              key={item.id} 
                              onClick={() => setSelectedProjectCr(item)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                                selectedProjectCr?.id === item.id ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <div>
                                <span className="font-medium text-gray-900">{item.title}</span>
                                <p className="text-xs text-gray-500 mt-1">{item.medium || "未填寫媒材"}</p>
                              </div>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-8" onClick={(e) => { e.stopPropagation(); setProjectCreations(projectCreations.filter(x => x.id !== item.id)) }}>刪除</Button>
                            </div>
                          ))
                        )}
                      </div>

                      {selectedProjectCr && (
                        <div className="bg-gray-900 text-white p-6 rounded-xl space-y-4 shadow-xl">
                          <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                            <h3 className="text-xl font-bold">✨ {selectedProjectCr.title}</h3>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setSelectedProjectCr(null)}>✕</Button>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 uppercase font-mono">創作媒材：</span>
                            <p className="font-medium text-sm mt-0.5">{selectedProjectCr.medium}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 uppercase font-mono">創作論述：</span>
                            <p className="text-sm text-gray-200 bg-gray-800/80 p-4 rounded-lg mt-1 whitespace-pre-wrap leading-relaxed">{selectedProjectCr.statement}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </CardContent>
              </Card>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}