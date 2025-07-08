"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"

interface UserLoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserLogin: (userName: string) => void
}

export function UserLoginDialog({ open, onOpenChange, onUserLogin }: UserLoginDialogProps) {
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName.trim()) return

    setIsLoading(true)
    try {
      onUserLogin(userName.trim())
      onOpenChange(false)
      setUserName("")
    } catch (error) {
      console.error("Giriş hatası:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Kullanıcı Girişi
          </DialogTitle>
          <DialogDescription>
            AHP değerlendirmesi yapmak için kullanıcı adınızı girin. Bu bilgi değerlendirmenizi kaydetmek için
            kullanılacaktır.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName">Kullanıcı Adı</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Adınızı ve soyadınızı girin"
              required
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              İptal
            </Button>
            <Button type="submit" disabled={!userName.trim() || isLoading}>
              {isLoading ? "Giriş Yapılıyor..." : "Devam Et"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
