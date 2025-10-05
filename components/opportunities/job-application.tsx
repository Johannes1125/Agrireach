"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Heart, Share2, Flag, Send, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-client"

interface Job {
  id: string
  title: string
  company: string
  skills: string[]
}

interface JobApplicationProps {
  job: Job
}

export function JobApplication({ job }: JobApplicationProps) {
  const [coverLetter, setCoverLetter] = useState("")
  const [isApplied, setIsApplied] = useState(false)

  // Mock user skills and match calculation
  const userSkills = ["Crop Harvesting", "Team Leadership", "Safety Protocols", "Equipment Operation"]
  const matchingSkills = job.skills.filter((skill) => userSkills.includes(skill))
  const matchPercentage = Math.round((matchingSkills.length / job.skills.length) * 100)

  const handleApply = async () => {
    try {
      const res = await authFetch(`/api/opportunities/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_letter: coverLetter }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.message || "Failed to apply")
      }
      setIsApplied(true)
      toast.success("Application submitted successfully!")
    } catch (e: any) {
      toast.error(e?.message || "Failed to apply")
    }
  }

  if (isApplied) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Application Submitted!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your application has been sent to {job.company}. They typically respond within 2-3 business days.
          </p>
          <Button variant="outline" className="w-full bg-transparent">
            View Application Status
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Skill Match */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Skill Match</CardTitle>
          <CardDescription>How well your skills match this job</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Match Score</span>
              <span className="font-medium">{matchPercentage}%</span>
            </div>
            <Progress value={matchPercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Matching Skills:</h4>
            <div className="flex flex-wrap gap-1">
              {matchingSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {job.skills.length > matchingSkills.length && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Skills to Develop:</h4>
              <div className="flex flex-wrap gap-1">
                {job.skills
                  .filter((skill) => !userSkills.includes(skill))
                  .map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Apply */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Apply for this Job</CardTitle>
          <CardDescription>Submit your application with a personalized message</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
            <Textarea
              id="cover-letter"
              placeholder="Tell the employer why you're interested in this position and how your experience makes you a great fit..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="min-h-24"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Your profile and resume will be automatically included</span>
          </div>

          <Button onClick={handleApply} className="w-full" size="lg">
            <Send className="mr-2 h-4 w-4" />
            Submit Application
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            By applying, you agree to share your profile information with {job.company}
          </div>
        </CardContent>
      </Card>

      {/* Job Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Job Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Heart className="mr-2 h-4 w-4" />
            Save Job
          </Button>

          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Share2 className="mr-2 h-4 w-4" />
            Share Job
          </Button>

          <Separator />

          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            <Flag className="mr-2 h-4 w-4" />
            Report Job
          </Button>
        </CardContent>
      </Card>

      {/* Application Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Application Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <span>Highlight relevant experience in your cover letter</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <span>Mention specific skills that match the job requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <span>Apply early - employers often review applications as they come in</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
