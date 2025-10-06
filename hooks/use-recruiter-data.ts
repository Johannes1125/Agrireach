"use client"

import { useState, useEffect } from "react"
import { authFetch } from "@/lib/auth-client"

export interface RecruiterJob {
  _id: string
  title: string
  location: string
  jobType: string
  urgency: string
  salary_range: {
    min: number
    max: number
  }
  created_at: string
  status: string
  applicantCount: number
}

export interface RecentApplicant {
  _id: string
  worker: {
    full_name: string
    avatar_url?: string
    trust_score: number
  }
  opportunity: {
    title: string
  }
  status: string
  created_at: string
}

export function useRecruiterData() {
  const [jobs, setJobs] = useState<RecruiterJob[]>([])
  const [applicants, setApplicants] = useState<RecentApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const [jobsRes, applicantsRes] = await Promise.all([
          authFetch("/api/dashboard/recruiter/jobs"),
          authFetch("/api/dashboard/recruiter/applicants?limit=5")
        ])

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json()
          setJobs(jobsData.data?.jobs || [])
        }

        if (applicantsRes.ok) {
          const applicantsData = await applicantsRes.json()
          setApplicants(applicantsData.data?.applicants || [])
        }
      } catch (err: any) {
        setError(err.message)
        console.error("Recruiter data fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { jobs, applicants, loading, error, refetch: () => setLoading(true) }
}

