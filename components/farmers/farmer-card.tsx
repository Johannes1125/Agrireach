import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Star, CheckCircle } from "lucide-react"
import Link from "next/link"

interface FarmerCardProps {
  farmer: {
    id: string
    name: string
    location: string
    specialty: string
    rating: number
    reviewCount: number
    experience: string
    image: string
    skills: string[]
    verified: boolean
  }
}

export function FarmerCard({ farmer }: FarmerCardProps) {
  return (
    <Link href={`/farmers/${farmer.id}`}>
      <Card className="group h-full border-2 transition-all hover:border-primary/20 hover:shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/10">
              <AvatarImage src={farmer.image || "/placeholder.svg"} alt={farmer.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {farmer.name
                  ? farmer.name.split(" ").map((n) => n[0]).join("")
                  : "F"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-lg font-bold truncate group-hover:text-primary transition-colors">
                  {farmer.name}
                </h3>
                {farmer.verified && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />}
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{farmer.location}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              {farmer.specialty}
            </Badge>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-semibold">{farmer.rating}</span>
                <span className="text-muted-foreground">({farmer.reviewCount})</span>
              </div>
              <div className="text-muted-foreground">{farmer.experience} exp.</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {farmer.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
