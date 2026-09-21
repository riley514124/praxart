"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" 
import { supabase } from "../../lib/supabase"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"

export default function AuthPage() {
  const router = useRouter() 
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async () => {
    setIsLoading(true)
    setMessage("⏳ 註冊中...")
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setMessage(`❌ 註冊失敗: ${error.message}`)
    } else {
      setMessage("✅ 註冊成功！正在為您進入後台...")
      router.push("/dashboard") 
    }
    setIsLoading(false)
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setMessage("⏳ 登入中...")
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(`❌ 登入失敗: ${error.message}`)
    } else {
      setMessage("✅ 登入成功！正在為您進入後台...")
      router.push("/dashboard") 
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Praxart</CardTitle>
          <CardDescription className="text-gray-500">
            藝術與實踐的交匯點。請登入以繼續。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">電子郵件</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {message && (
            <div className={`p-3 rounded text-sm ${message.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "處理中..." : "登入"}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleSignUp} disabled={isLoading}>
            建立新帳號
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}