'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFeedback } from '@/contexts/FeedbackContext'

export function GuestIdentityDialog() {
  const { identityPromptOpen, setIdentityPromptOpen, guestProfile, saveGuestProfile, setFeedbackMode } =
    useFeedback()

  const [name, setName] = useState(guestProfile?.name ?? '')
  const [email, setEmail] = useState(guestProfile?.email ?? '')

  const isRename = Boolean(guestProfile)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    saveGuestProfile(trimmed, email.trim() || undefined)
    setIdentityPromptOpen(false)
    if (!isRename) {
      setFeedbackMode(true)
    }
  }

  return (
    <Dialog open={identityPromptOpen} onOpenChange={setIdentityPromptOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isRename ? 'Change your display name' : 'Add your name to comment'}</DialogTitle>
          <DialogDescription>
            {isRename
              ? 'Update the name shown on your pins and replies.'
              : 'No account needed. Just add your name and start commenting.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="guest-name">Display name</Label>
            <Input
              id="guest-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guest-email">
              Email <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="guest-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" className="w-full" disabled={!name.trim()}>
            {isRename ? 'Save' : 'Start commenting'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
