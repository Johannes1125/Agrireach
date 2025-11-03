"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, Plus, MapPin, DollarSign, Calendar, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogAction,
  DialogCancel,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { handleRoleValidationError } from "@/lib/role-validation-client";
import { ImageUpload } from "@/components/ui/image-upload";
import { LocationPicker, LocationData } from "@/components/ui/location-picker";

export function PostJobForm() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [companyLogo, setCompanyLogo] = useState<string | undefined>(undefined)
  const [jobType, setJobType] = useState<string | undefined>(undefined)
  const [urgency, setUrgency] = useState<string | undefined>(undefined)
  const [jobLocation, setJobLocation] = useState<LocationData>({ address: "" })

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
    setShowConfirmDialog(true)
  }

  const handleConfirmedSubmit = async () => {
    setIsSubmitting(true)
    setShowConfirmDialog(false)
    try {
      const title = (document.getElementById("job-title") as HTMLInputElement)?.value
      const description = (document.getElementById("description") as HTMLTextAreaElement)?.value
      const location = jobLocation.address || ""
      const company_name = (document.getElementById("company-name") as HTMLInputElement)?.value
      const benefitsText = (document.getElementById("benefits") as HTMLTextAreaElement)?.value || ""
      const requirementsText = (document.getElementById("requirements") as HTMLTextAreaElement)?.value || ""
      const benefits = benefitsText.split(/\n|,|;/).map((s) => s.trim()).filter(Boolean)
      const requirements = requirementsText.split(/\n|,|;/).map((s) => s.trim()).filter(Boolean)
      const pay_rate = Number((document.getElementById("pay-min") as HTMLInputElement)?.value || 0)
      const pay_rate_max_raw = (document.getElementById("pay-max") as HTMLInputElement)?.value
      const pay_rate_max = pay_rate_max_raw ? Number(pay_rate_max_raw) : undefined
      const pay_type = "hourly"
      // Map UI urgency values to API schema values
      const mappedUrgency = ((): string => {
        switch (urgency) {
          case "standard":
            return "low"
          case "medium":
            return "medium"
          case "high":
            return "high"
          case "urgent":
            return "urgent"
          default:
            return "low"
        }
      })()
      const start_date = (document.getElementById("deadline") as HTMLInputElement)?.value || undefined
      const contact_email = (document.getElementById("contact-email") as HTMLInputElement)?.value || undefined
      const work_schedule = (document.getElementById("schedule") as HTMLTextAreaElement)?.value || undefined
      // Ensure required selections exist
      if (!jobType) {
        throw new Error("Please select a job type")
      }
      const payload: any = {
        title,
        description,
        category: "general",
        location,
        location_coordinates: jobLocation.coordinates,
        company_name,
        company_logo: companyLogo,
        contact_email,
        pay_rate,
        pay_type,
        pay_rate_max,
        // Save UI job type as duration (string) in backend
        duration: jobType,
        urgency: mappedUrgency,
        required_skills: selectedSkills,
        requirements,
        benefits,
        work_schedule,
        start_date,
      }
      const res = await fetch("/api/opportunities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || "Failed to post job")
      const id = json?.data?.id
      toast.success("Job posted successfully!")
      window.location.href = id ? `/opportunities/${id}` : "/opportunities"
    } catch (e: any) {
      // Check if it's a role validation error
      if (e?.message?.includes("role") && e?.message?.includes("Settings")) {
        handleRoleValidationError(e);
      } else {
        toast.error(e?.message || "Failed to post job");
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Users className="h-5 w-5" />
              Basic Job Information
            </CardTitle>
            <CardDescription>Provide the essential details about your job opening</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title *</Label>
                <Input id="job-title" placeholder="e.g., Seasonal Harvest Coordinator" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-type">Job Type *</Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input id="company-name" placeholder="Your company or farm name" required />
            </div>

            <div className="space-y-2">
              <LocationPicker
                value={jobLocation}
                onChange={setJobLocation}
                label="Location"
                placeholder="Enter job location or use current location"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Job Description</CardTitle>
            <CardDescription>Describe the role and what you're looking for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <ImageUpload
                type="business"
                maxFiles={1}
                onUploadComplete={(imgs) => setCompanyLogo(imgs[0]?.url)}
                onUploadError={(err) => toast.error(err)}
              />
            </div>

            {/* Job Images removed per request */}
            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide a detailed description of the job responsibilities, work environment, and what makes this opportunity special..."
                className="min-h-32"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                placeholder="List the required skills, experience, and qualifications for this position..."
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits & Perks</Label>
              <Textarea
                id="benefits"
                placeholder="Describe the benefits, perks, and what makes working with you attractive..."
                className="min-h-24"
              />
            </div>
          </CardContent>
        </Card>

        {/* Compensation & Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Compensation & Schedule
            </CardTitle>
            <CardDescription>Set the pay range and work schedule details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pay-min">Minimum Pay (₱/hour) *</Label>
                <Input id="pay-min" type="number" placeholder="60" min="60" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay-max">Maximum Pay (₱/hour) *</Label>
                <Input id="pay-max" type="number" placeholder="100" min="60" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Work Schedule</Label>
              <Textarea
                id="schedule"
                placeholder="Describe the work schedule, hours, and any flexibility..."
                className="min-h-20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills & Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Required Skills</CardTitle>
            <CardDescription>Select the skills needed for this position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              {availableSkills.map((skill) => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox
                    id={skill}
                    checked={selectedSkills.includes(skill)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        addSkill(skill)
                      } else {
                        removeSkill(skill)
                      }
                    }}
                  />
                  <Label htmlFor={skill} className="text-sm cursor-pointer">
                    {skill}
                  </Label>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Add Custom Skill</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a custom skill"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                />
                <Button type="button" variant="outline" onClick={addCustomSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedSkills.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Skills ({selectedSkills.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Application Settings
            </CardTitle>
            <CardDescription>Configure how applications are handled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input id="deadline" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Hiring Urgency</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Timeline</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent Hiring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input id="contact-email" type="email" placeholder="hiring@yourcompany.com" />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex flex-col gap-4 pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" required />
            <Label htmlFor="terms" className="text-sm">
              I agree to the AgriReach Terms of Service and confirm that this job posting complies with all applicable
              laws
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Publishing Job..." : "Publish Job"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your job will be reviewed and published within 24 hours. You'll receive email notifications for new
            applications.
          </p>
        </div>
      </form>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Job Posting</DialogTitle>
            <DialogDescription>
              Are you sure you want to publish this job? Once published, it will be visible to all workers on the
              platform and you'll start receiving applications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogCancel>Cancel</DialogCancel>
            <DialogAction onClick={handleConfirmedSubmit}>Publish Job</DialogAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
