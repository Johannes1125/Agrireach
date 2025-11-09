"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authFetch } from "@/lib/auth-client"
import { useNotifications } from "@/components/notifications/notification-provider"
import { getRoleDisplay } from "@/lib/role-utils"
import { formatDate } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { SKILL_LEVELS, SKILL_LEVEL_COLORS } from "@/lib/skills"
import { 
  Users, 
  Edit, 
  Trash2, 
  Star, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle,
  X,
  Eye,
  Calendar,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"

interface JobApplicant {
  _id: string
  worker: {
    _id: string
    full_name: string
    email: string
    phone?: string
    avatar_url?: string
    trust_score: number
    location?: string
  }
  status: string
  created_at: string
  cover_letter?: string
  resume_url?: string
  match_score?: number | null
  highlighted_skills?: Array<{ name: string; level?: number }>
  match_details?: Array<{
    skill: string
    match: boolean
    level?: number
    required_level?: number
    weight: number
  }>
}

interface ManageJobModalProps {
  job: {
    _id: string
    title: string
    location: string
    jobType: string
    urgency: string
    salary_range: {
      min: number
      max: number
    }
    applicantCount: number
  }
  open: boolean
  onClose: () => void
  onEdit: (jobId: string) => void
  onDelete: (jobId: string) => void
}

export function ManageJobModal({ job, open, onClose, onEdit, onDelete }: ManageJobModalProps) {
  const [applicants, setApplicants] = useState<JobApplicant[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<JobApplicant | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const notifications = useNotifications()

  useEffect(() => {
    if (open && job._id) {
      fetchApplicants()
    }
  }, [open, job._id])

  const fetchApplicants = async () => {
    try {
      setLoading(true)
      const res = await authFetch(`/api/opportunities/${job._id}/applications`)
      
      if (res.ok) {
        const data = await res.json()
        setApplicants(data.data?.applications || [])
      } else {
        toast.error("Failed to load applicants")
      }
    } catch (error) {
      console.error("Error fetching applicants:", error)
      toast.error("Failed to load applicants")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      // Optimistic UI update
      setApplicants(prev => prev.map(a => a._id === applicationId ? { ...a, status: newStatus } : a))
      const res = await authFetch(`/api/opportunities/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(`Application ${newStatus}`)
      } else {
        toast.error("Failed to update application")
        // revert on failure
        setApplicants(prev => prev.map(a => a._id === applicationId ? { ...a, status: "pending" } : a))
      }
    } catch (error) {
      console.error("Error updating application:", error)
      toast.error("Failed to update application")
      setApplicants(prev => prev.map(a => a._id === applicationId ? { ...a, status: "pending" } : a))
    }
  }

  const handleDeleteJob = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    onDelete(job._id)
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{job.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 inline mr-1" />
                {job.location} • {job.jobType}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(job._id)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Job
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteJob}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Job Details */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Urgency</p>
              <Badge variant={job.urgency === "high" ? "destructive" : job.urgency === "medium" ? "default" : "secondary"}>
                {job.urgency}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Salary Range</p>
              <p className="font-medium">
                {job.salary_range?.min && job.salary_range?.max 
                  ? `₱${job.salary_range.min.toLocaleString()} - ₱${job.salary_range.max.toLocaleString()}`
                  : 'Not specified'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Applicants</p>
              <p className="font-medium flex items-center gap-1">
                <Users className="h-4 w-4" />
                {job.applicantCount}
              </p>
            </div>
          </div>

          {/* Applicants List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Applicants</h3>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading applicants...</div>
            ) : applicants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No applicants yet
              </div>
            ) : (
              <div className="space-y-3">
                {applicants.map((applicant) => {
                  const rating = (applicant.worker.trust_score / 20).toFixed(1)
                  const matchScore = typeof applicant.match_score === "number" ? applicant.match_score : null
                  const highlightedSkills = applicant.highlighted_skills || []
                  const matchDetails = applicant.match_details || []
                  const perfectMatches = matchDetails.filter(detail => detail.match && (!detail.required_level || detail.level === undefined || detail.level >= detail.required_level))
                  const improvementSkills = matchDetails.filter(detail => detail.match && detail.required_level && detail.level !== undefined && detail.level < detail.required_level)
                  const missingSkills = matchDetails.filter(detail => !detail.match)
                  return (
                    <div key={applicant._id} className="rounded-xl p-4 space-y-3 border bg-card hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={applicant.worker.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {applicant.worker.full_name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{applicant.worker.full_name}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {applicant.worker.email}
                              </span>
                              {applicant.worker.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {applicant.worker.phone}
                                </span>
                              )}
                              {applicant.worker.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {applicant.worker.location}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span>{rating}</span>
                              </div>
                              <Badge variant={
                                applicant.status === "accepted" ? "default" : 
                                applicant.status === "rejected" ? "destructive" : 
                                "secondary"
                              }>
                                {applicant.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(applicant.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {applicant.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                              onClick={() => handleStatusChange(applicant._id, "accepted")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                              onClick={() => handleStatusChange(applicant._id, "rejected")}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>

                      {(matchScore !== null || highlightedSkills.length > 0 || matchDetails.length > 0) && (
                        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-medium">Skill Match Overview</span>
                            {matchScore !== null && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{matchScore}%</span>
                                <Progress value={matchScore} className="h-2 w-24" />
                              </div>
                            )}
                          </div>

                          {highlightedSkills.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Highlighted Skills</p>
                              <div className="flex flex-wrap gap-2">
                                {highlightedSkills.map((skill) => {
                                  const level = skill.level as 1 | 2 | 3 | 4 | undefined
                                  const levelLabel = level ? SKILL_LEVELS[level] : null
                                  const levelClass = level ? SKILL_LEVEL_COLORS[level] : ""
                                  return (
                                    <Badge key={skill.name} variant="outline" className="flex items-center gap-1 text-xs">
                                      <span>{skill.name}</span>
                                      {levelLabel && (
                                        <span className={`rounded-full border px-2 py-0.5 ${levelClass}`}>
                                          {levelLabel}
                                        </span>
                                      )}
                                    </Badge>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {(improvementSkills.length > 0 || missingSkills.length > 0) && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Next Steps</p>
                              <div className="flex flex-wrap gap-2">
                                {improvementSkills.map((detail) => (
                                  <Badge key={`improve-${detail.skill}`} variant="outline" className="text-xs">
                                    {detail.skill} • Need {detail.required_level ? SKILL_LEVELS[detail.required_level as 1 | 2 | 3 | 4] : "higher level"}
                                  </Badge>
                                ))}
                                {missingSkills.map((detail) => (
                                  <Badge key={`missing-${detail.skill}`} variant="destructive" className="text-xs">
                                    Missing {detail.skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {perfectMatches.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Strong Matches</p>
                              <div className="flex flex-wrap gap-2">
                                {perfectMatches.map((detail) => (
                                  <Badge key={`match-${detail.skill}`} variant="secondary" className="text-xs">
                                    {detail.skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {applicant.cover_letter && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Cover Letter</p>
                          <p className="text-sm text-muted-foreground">{applicant.cover_letter}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedApplicant(applicant); setPreviewOpen(true); }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        {applicant.resume_url && (
                          <a href={applicant.resume_url} target="_blank" className="inline-flex">
                            <Button variant="outline" size="sm" className="bg-transparent">
                              Download Resume
                            </Button>
                          </a>
                        )}
                        {applicant.status !== 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => handleStatusChange(applicant._id, 'pending')}
                          >
                            Undo
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Applicant Preview Modal */}
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Applicant Profile</DialogTitle>
        </DialogHeader>
        {selectedApplicant && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {selectedApplicant.worker.avatar_url ? (
                  <img src={selectedApplicant.worker.avatar_url} alt={selectedApplicant.worker.full_name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm text-muted-foreground">{selectedApplicant.worker.full_name.split(' ').map(n=>n[0]).join('')}</span>
                )}
              </div>
              <div>
                <div className="font-medium">{selectedApplicant.worker.full_name}</div>
                <div className="text-sm text-muted-foreground">{selectedApplicant.worker.email}</div>
                {selectedApplicant.worker.location && (
                  <div className="text-xs text-muted-foreground">{selectedApplicant.worker.location}</div>
                )}
              </div>
            </div>
            <div className="text-sm">
              <div className="mb-1"><span className="text-muted-foreground">Trust score:</span> {selectedApplicant.worker.trust_score}</div>
                {typeof selectedApplicant.match_score === "number" && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Match Score</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{selectedApplicant.match_score}%</span>
                      <Progress value={selectedApplicant.match_score} className="h-2 w-24" />
                    </div>
                  </div>
                )}
                {selectedApplicant.highlighted_skills?.length ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Highlighted Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplicant.highlighted_skills.map((skill) => {
                        const level = skill.level as 1 | 2 | 3 | 4 | undefined
                        const levelLabel = level ? SKILL_LEVELS[level] : null
                        const levelClass = level ? SKILL_LEVEL_COLORS[level] : ""
                        return (
                          <Badge key={`preview-${skill.name}`} variant="outline" className="flex items-center gap-1 text-xs">
                            <span>{skill.name}</span>
                            {levelLabel && (
                              <span className={`rounded-full border px-2 py-0.5 ${levelClass}`}>
                                {levelLabel}
                              </span>
                            )}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
                {selectedApplicant.match_details && selectedApplicant.match_details.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Skill Details</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplicant.match_details.map((detail) => (
                        <Badge
                          key={`detail-${detail.skill}`}
                          variant={detail.match ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {detail.skill}
                          {detail.required_level && detail.level !== undefined && detail.level < detail.required_level && (
                            <span className="ml-1">(needs {SKILL_LEVELS[detail.required_level as 1 | 2 | 3 | 4]})</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              {selectedApplicant.cover_letter && (
                <div className="mt-2">
                  <div className="text-muted-foreground text-sm font-medium">Cover Letter</div>
                  <div className="p-3 bg-muted/40 rounded-md text-sm">{selectedApplicant.cover_letter}</div>
                </div>
              )}
              {selectedApplicant.resume_url && (
                <div className="mt-2">
                  <a href={selectedApplicant.resume_url} target="_blank" className="text-primary text-sm underline">Download Resume</a>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Job Posting?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{job.title}"</span>?
            </p>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                All applications for this job will also be permanently deleted.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

