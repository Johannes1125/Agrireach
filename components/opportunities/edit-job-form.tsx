"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface EditJobFormProps {
  job: any
}

export function EditJobForm({ job }: EditJobFormProps) {
  const router = useRouter()
  const [selectedSkills, setSelectedSkills] = useState<string[]>(job.required_skills || [])
  const [customSkill, setCustomSkill] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableSkills = [
    "Crop Harvesting",
    "Organic Farming",
    "Equipment Operation",
    "Soil Management",
    "Livestock Care",
    "Greenhouse Management",
    "Pest Control",
    "Irrigation Systems",
    "Team Leadership",
    "Quality Control",
    "Safety Protocols",
    "Mechanical Skills",
    "Plant Science",
    "Animal Husbandry",
    "Food Processing",
    "Packaging",
  ]

  const addSkill = (skill: string) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill))
  }

  const addCustomSkill = () => {
    if (customSkill.trim()) {
      addSkill(customSkill.trim())
      setCustomSkill("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      
      const benefitsText = formData.get("benefits") as string || ""
      const requirementsText = formData.get("requirements") as string || ""
      const benefits = benefitsText.split(/\n|,|;/).map((s) => s.trim()).filter(Boolean)
      const requirements = requirementsText.split(/\n|,|;/).map((s) => s.trim()).filter(Boolean)

      const payload = {
        title: formData.get("title"),
        description: formData.get("description"),
        location: formData.get("location"),
        company_name: formData.get("company_name"),
        contact_email: formData.get("contact_email"),
        // Save selected job type as `duration` (string)
        duration: formData.get("job_type") || undefined,
        urgency: formData.get("urgency") || undefined,
        // Persist pay min/max to new fields
        pay_rate: Number(formData.get("salary_min")) || 0,
        pay_rate_max: ((): number | undefined => {
          const v = Number(formData.get("salary_max")) || 0
          return v > 0 ? v : undefined
        })(),
        required_skills: selectedSkills,
        requirements,
        benefits,
        work_schedule: (formData.get("work_schedule") as string) || undefined,
        start_date: formData.get("start_date") || undefined,
      }

      const res = await authFetch(`/api/opportunities/${job._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.message || "Failed to update job")
      }

      toast.success("Job updated successfully!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error updating job:", error)
      toast.error(error.message || "Failed to update job")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Farm Worker, Harvest Manager, Livestock Caretaker"
                required
                defaultValue={job.title}
              />
            </div>

            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the role, responsibilities, and what makes this opportunity great..."
                rows={6}
                required
                defaultValue={job.description}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Baguio City, Benguet"
                  required
                  defaultValue={job.location}
                />
              </div>

              <div>
                <Label htmlFor="company_name">Company/Farm Name *</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  placeholder="Your company or farm name"
                  required
                  defaultValue={job.company_name}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Job Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="job_type">Job Type *</Label>
              <Select name="job_type" defaultValue={job.duration || job.job_type || "full-time"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgency">Urgency *</Label>
              <Select name="urgency" defaultValue={job.urgency || "medium"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Compensation */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Compensation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary_min">Minimum Pay (₱) *</Label>
              <Input
                id="salary_min"
                name="salary_min"
                type="number"
                min="0"
                placeholder="e.g., 15000"
                required
                defaultValue={job.pay_rate || job.salary_range?.min || 0}
              />
            </div>
            <div>
              <Label htmlFor="salary_max">Maximum Pay (₱)</Label>
              <Input
                id="salary_max"
                name="salary_max"
                type="number"
                min="0"
                placeholder="e.g., 25000"
                defaultValue={job.pay_rate_max || job.salary_range?.max || 0}
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Required Skills</h3>
          <div className="space-y-4">
            <div>
              <Label>Select from common skills</Label>
              <Select onValueChange={(value) => addSkill(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a skill..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSkills.map((skill) => (
                    <SelectItem key={skill} value={skill} disabled={selectedSkills.includes(skill)}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Input
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="Or add a custom skill..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomSkill()
                  }
                }}
              />
              <Button type="button" onClick={addCustomSkill} variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="pl-3 pr-2 py-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Requirements & Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="requirements">Requirements (one per line)</Label>
            <Textarea
              id="requirements"
              name="requirements"
              placeholder="e.g., At least 2 years experience&#10;Must be physically fit&#10;Valid driver's license"
              rows={4}
              defaultValue={(job.requirements || []).join("\n")}
            />
          </div>

          <div>
            <Label htmlFor="benefits">Benefits (one per line)</Label>
            <Textarea
              id="benefits"
              name="benefits"
              placeholder="e.g., Health insurance&#10;Free meals&#10;Transportation allowance"
              rows={4}
              defaultValue={(job.benefits || []).join("\n")}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={job.start_date ? new Date(job.start_date).toISOString().split('T')[0] : ""}
              />
            </div>

            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="recruiting@yourfarm.com"
                defaultValue={job.contact_email}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="work_schedule">Work Schedule</Label>
              <Textarea
                id="work_schedule"
                name="work_schedule"
                placeholder="Describe the work schedule, hours, and any flexibility..."
                rows={4}
                defaultValue={job.work_schedule}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Updating..." : "Update Job Posting"}
        </Button>
      </div>
    </form>
  )
}

