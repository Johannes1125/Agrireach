"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Heart, Share2, Flag, Send, CheckCircle, AlertCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-client"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { UserX } from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import {
  Skill,
  SkillRequirement,
  calculateMatchScore,
  normalizeSkills,
  normalizeSkillRequirements,
  SKILL_LEVELS,
  SKILL_LEVEL_COLORS,
} from "@/lib/skills"

interface Job {
  id: string
  title: string
  company: string
  skills: SkillRequirement[]
}

interface JobApplicationProps {
  job: Job
}

export function JobApplication({ job }: JobApplicationProps) {
  const [coverLetter, setCoverLetter] = useState("")
  const [resumeUrl, setResumeUrl] = useState<string | undefined>(undefined)
  const [isApplied, setIsApplied] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([])
  const { user, loading } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile()
  const router = useRouter()

  const workerSkills = useMemo(() => normalizeSkills(profile?.skills as any), [profile?.skills])
  const jobRequirements = useMemo(
    () => normalizeSkillRequirements(job.skills as any),
    [job.skills]
  )
  const matchResult = useMemo(
    () => calculateMatchScore(jobRequirements, workerSkills),
    [jobRequirements, workerSkills]
  )

  useEffect(() => {
    if (workerSkills.length === 0) {
      setSelectedSkills([])
      return
    }
    const matched = workerSkills.filter((skill) =>
      jobRequirements.some((req) => req.name.toLowerCase() === skill.name.toLowerCase())
    )
    setSelectedSkills(matched)
  }, [workerSkills, jobRequirements])

  const fullyMatchedSkills = matchResult.details.filter((detail) => {
    if (!detail.match) return false
    if (detail.required_level && detail.level && detail.level < detail.required_level) return false
    return true
  })

  const skillsNeedingDevelopment = matchResult.details.filter((detail) => {
    if (!detail.match) return false
    if (!detail.required_level || detail.level === undefined) return false
    return detail.level < detail.required_level
  })

  const missingSkills = matchResult.details.filter((detail) => !detail.match)

  const matchPercentage = matchResult.total > 0 ? matchResult.score : 0

  const canApply = user && user.roles?.includes("worker")

  const handleApply = async () => {
    if (!user) {
      toast.error("Please log in to apply for jobs")
      return
    }

    if (!canApply) {
      toast.error("You need the Worker role to apply for jobs. Update your roles in Settings.")
      return
    }

    try {
      const res = await authFetch(`/api/opportunities/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cover_letter: coverLetter,
          resume_url: resumeUrl,
          highlighted_skills: selectedSkills.map((skill) => ({
            name: skill.name,
            level: skill.level,
          })),
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.message || "Failed to apply")
      }
      setIsApplied(true)
      toast.success("Application submitted successfully!")
      // Redirect to Opportunities page after a brief delay
      setTimeout(() => {
        router.push("/opportunities")
      }, 800)
    } catch (e: any) {
      console.error("Application error:", e)
      toast.error(e?.message || "Failed to apply. Please check your connection and try again.")
    }
  }

  if (loading || profileLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Login Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You need to be logged in to apply for jobs.
          </p>
          <Link href="/auth/login">
            <Button className="w-full">
              Log In to Apply
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (!canApply) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Worker Role Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You need the Worker role to apply for jobs. Add it to your profile to start applying!
          </p>
          <Link href="/settings">
            <Button className="w-full">
              Update Roles in Settings
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
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
              {fullyMatchedSkills.map((detail) => (
                <Badge key={detail.skill} variant="secondary" className="text-xs">
                  {detail.skill}
                </Badge>
              ))}
              {fullyMatchedSkills.length === 0 && (
                <span className="text-xs text-muted-foreground">No perfect matches yet</span>
              )}
            </div>
          </div>

          {(skillsNeedingDevelopment.length > 0 || missingSkills.length > 0) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Skills to Improve:</h4>
              <div className="flex flex-wrap gap-1">
                {skillsNeedingDevelopment.map((detail) => (
                  <Badge key={detail.skill} variant="outline" className="text-xs">
                    {detail.skill} (Need {SKILL_LEVELS[detail.required_level as keyof typeof SKILL_LEVELS]})
                  </Badge>
                ))}
                {missingSkills.map((detail) => (
                  <Badge key={detail.skill} variant="outline" className="text-xs">
                    {detail.skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Highlight Skills */}
      {workerSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Highlight Your Skills</CardTitle>
            <CardDescription>Select which skills to emphasize in your application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {workerSkills.map((skill) => {
                const isSelected = selectedSkills.some(
                  (s) => s.name.toLowerCase() === skill.name.toLowerCase()
                )
                const badgeColor = SKILL_LEVEL_COLORS[skill.level]
                return (
                  <button
                    key={skill.name}
                    type="button"
                    onClick={() => {
                      setSelectedSkills((prev) => {
                        if (isSelected) {
                          return prev.filter(
                            (entry) => entry.name.toLowerCase() !== skill.name.toLowerCase()
                          )
                        }
                        return [...prev, skill]
                      })
                    }}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      isSelected ? "border-primary text-primary" : "border-border text-muted-foreground"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="mr-2 font-medium text-foreground">{skill.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${badgeColor}`}>
                      {SKILL_LEVELS[skill.level]}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected skills will be sent with your application so recruiters can quickly review how you match their requirements.
            </p>
          </CardContent>
        </Card>
      )}

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

          <div className="space-y-2">
            <Label>Attach Resume (PDF, DOCX or image up to 10MB)</Label>
            <ImageUpload
              type="general"
              maxFiles={1}
              acceptedTypes={['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png']}
              onUploadComplete={(imgs) => setResumeUrl(imgs[0]?.url)}
              onUploadError={(err) => toast.error(err)}
            />
            {resumeUrl && (
              <p className="text-xs text-muted-foreground">Attached: {resumeUrl.split('/').pop()}</p>
            )}
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
