export function SimilarJobs({ currentJobId }: SimilarJobsProps) {
  // Mock similar jobs data - replace with actual data fetching
  const similarJobs = [
    {
      id: "2",
      title: "Organic Farm Specialist",
      company: "Sustainable Acres",
      location: "Salinas, CA",
      type: "Full-time",
      payRange: "$20-25/hour",
      rating: 4.9,
      matchScore: 88,
    },
    {
      id: "5",
      title: "Greenhouse Manager",
      company: "Coastal Growing",
      location: "Ventura, CA",
      type: "Full-time",
      payRange: "$25-32/hour",
      rating: 4.8,
      matchScore: 91,
    },
    {
      id: "3",
      title: "Equipment Operator",
      company: "Valley Equipment",
      location: "Bakersfield, CA",
      type: "Contract",
      payRange: "$22-28/hour",
      rating: 4.5,
      matchScore: 82,
    },
  ].filter((job) => job.id !== currentJobId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Similar Jobs</CardTitle>
        <CardDescription>Other opportunities you might be interested in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {similarJobs.map((job) => (
          <div key={job.id} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link href={/opportunities/${job.id}}>
                  <h4 className="font-medium hover:text-primary transition-colors cursor-pointer">{job.title}</h4>
                </Link>
                <p className="text-sm text-muted-foreground">{job.company}</p>
              </div>

              {job.matchScore >= 85 && (
                <Badge variant="secondary" className="text-xs">
                  {job.matchScore}% Match
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{job.location}</span>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{job.type}</span>
              </div>

              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{job.rating}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-primary">{job.payRange}</span>
              <Link href={/opportunities/${job.id}}>
                <Button size="sm" variant="outline">
                  View Job
                </Button>
              </Link>
            </div>
          </div>
        ))}

        <div className="pt-2">
          <Link href="/opportunities">
            <Button variant="ghost" className="w-full">
              View All Jobs
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}