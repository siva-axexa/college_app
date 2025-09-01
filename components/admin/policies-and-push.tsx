"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Bell } from "lucide-react"

export default function PoliciesAndPush() {
  const [privacy, setPrivacy] = useState("Your Privacy Policy content goes here...")
  const [terms, setTerms] = useState("Your Terms & Conditions content goes here...")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-4">
        <h2 className="text-lg font-medium mb-2">Edit Privacy Policy</h2>
        <Textarea className="min-h-[220px]" value={privacy} onChange={(e) => setPrivacy(e.target.value)} />
        <div className="mt-3 flex justify-end">
          <Button variant="secondary">Save Policy</Button>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-medium mb-2">Edit Terms & Conditions</h2>
        <Textarea className="min-h-[220px]" value={terms} onChange={(e) => setTerms(e.target.value)} />
        <div className="mt-3 flex justify-end">
          <Button variant="secondary">Save Terms</Button>
        </div>
      </Card>

      <Card className="p-4 lg:col-span-2">
        <h2 className="text-lg font-medium mb-2">Push Notification</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
            />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="body">Message</Label>
            <Input id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Short message body" />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This is a mock UI. Hook this to your push provider (e.g., FCM, APNs, or a server route) to actually deliver
          notifications.
        </p>
      </Card>
    </div>
  )
}
