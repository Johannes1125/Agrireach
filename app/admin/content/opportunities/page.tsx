"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Briefcase, CheckCircle, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth-client"
import { toast } from "sonner"

export default function OpportunitiesContentPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const res = await authFetch('/api/opportunities?page=1&limit=100')
        const json = await res.json()
        setJobs(json?.data?.items || json?.items || [])
      } catch (e) {
        setJobs([])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const jobAction = async (id: string, action: string) => {
    try {
      const res = await authFetch(`/api/admin/opportunities/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      if (!res.ok) throw new Error('Failed')
      toast.success('Updated')
    } catch (e: any) { toast.error(e.message || 'Failed') }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Opportunities</h1>
          <p className="text-muted-foreground">Manage job postings and applications</p>
        </div>
        <Button>Create Job</Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Job Management</CardTitle>
          <CardDescription>Search, filter, and manage opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search jobs, recruiters, locations..." className="pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">Title</th>
                  <th className="p-4 font-medium">Recruiter</th>
                  <th className="p-4 font-medium">Location</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Applications</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center"><Briefcase className="h-5 w-5 text-muted-foreground" /></div>
                        <div>
                          <div className="font-medium">{job.title}</div>
                          <div className="text-sm text-muted-foreground">₱{job.pay_rate}/{job.pay_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{job.recruiter_id?.full_name || 'Unknown'}</td>
                    <td className="p-4">{job.location}</td>
                    <td className="p-4"><Badge variant={job.status === 'active' ? 'secondary' : job.status === 'closed' ? 'outline' : 'destructive'}>{job.status}</Badge></td>
                    <td className="p-4">{job.applications_count || 0}</td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info('TODO: view job')}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('TODO: edit job')}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          {job.status !== 'active' && (
                            <DropdownMenuItem onClick={() => jobAction(job._id, 'open')}><CheckCircle className="mr-2 h-4 w-4" />Open</DropdownMenuItem>
                          )}
                          {job.status === 'active' && (
                            <DropdownMenuItem onClick={() => jobAction(job._id, 'close')}><Lock className="mr-2 h-4 w-4" />Close</DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600" onClick={() => jobAction(job._id, 'remove')}><Trash2 className="mr-2 h-4 w-4" />Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


