"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface UserLoginDialogProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (username: string) => void
  currentUserName: string | null
}

export function UserLoginDialog({ isOpen, onClose, onLogin, currentUserName }: UserLoginDialogProps) {
  const [username, setUsername] = useState(currentUserName || "")
  const { toast } = useToast()

  const handleLogin = () => {
    if (username.trim()) {
      onLogin(username.trim())
      onClose()
      toast({
        title: "Giriş Başarılı",
        description: `Hoş geldiniz, ${username.trim()}!`,
      })
    } else {
      toast({
        title: "Uyarı",
        description: "Lütfen bir kullanıcı adı girin.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kullanıcı Girişi</DialogTitle>
          <DialogDescription>
            Lütfen devam etmek için bir kullanıcı adı girin. Bu, değerlendirmelerinizin kaydedilmesi için
            kullanılacaktır.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Kullanıcı Adı
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
              placeholder="Örn: Ayşe Yılmaz"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleLogin()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleLogin}>
            Giriş Yap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
