"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"
import { useState, useEffect } from "react"

interface FilterStats {
  jobTypes: Array<{ id: string; label: string; count: number }>;
  categories: Array<{ id: string; label: string; count: number }>;
  experience: Array<{ id: string; label: string; count: number }>;
  urgency: Array<{ id: string; label: string; count: number }>;
  payRange: {
    minPay: number;
    maxPay: number;
    avgMinPay: number;
    avgMaxPay: number;
  };
}

interface OpportunityFiltersProps {
  onFiltersChange?: (filters: {
    payRange: [number, number];
    selectedFilters: string[];
  }) => void;
}

export function OpportunityFilters({ onFiltersChange }: OpportunityFiltersProps) {
  const [payRange, setPayRange] = useState([60, 100])
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [filterStats, setFilterStats] = useState<FilterStats>({
    jobTypes: [],
    categories: [],
    experience: [],
    urgency: [],
    payRange: { minPay: 60, maxPay: 100, avgMinPay: 70, avgMaxPay: 90 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFilterStats = async () => {
      try {
        const response = await fetch("/api/opportunities/filter-stats");
        if (response.ok) {
          const data = await response.json();
          setFilterStats(data.data);
          // Set initial pay range based on actual data
          setPayRange([Math.round(data.data.payRange.avgMinPay), Math.round(data.data.payRange.avgMaxPay)]);
        }
      } catch (error) {
        console.error("Failed to fetch filter statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterStats();
  }, [])

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) => {
      const newFilters = prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId];
      onFiltersChange?.({ payRange, selectedFilters: newFilters });
      return newFilters;
    });
  }

  // Notify parent when pay range changes
  useEffect(() => {
    onFiltersChange?.({ payRange, selectedFilters });
  }, [payRange, selectedFilters, onFiltersChange]);

  const clearAllFilters = () => {
    const resetPayRange: [number, number] = [Math.round(filterStats.payRange.avgMinPay), Math.round(filterStats.payRange.avgMaxPay)];
    setSelectedFilters([])
    setPayRange(resetPayRange)
    onFiltersChange?.({ payRange: resetPayRange, selectedFilters: [] });
  }

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {selectedFilters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {selectedFilters.map((filterId) => (
                <Badge key={filterId} variant="secondary" className="flex items-center gap-1">
                  {filterId.replace("-", " ")}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter(filterId)} />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pay Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Pay Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="px-2">
            <Slider 
              value={payRange} 
              onValueChange={setPayRange} 
              max={Math.max(100, filterStats.payRange.maxPay)} 
              min={Math.min(60, filterStats.payRange.minPay)} 
              step={1} 
              className="w-full" 
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>₱{payRange[0]}/hour</span>
            <span>₱{payRange[1]}/hour</span>
          </div>
        </CardContent>
      </Card>

      {/* Job Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            filterStats.jobTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={selectedFilters.includes(type.id)}
                    onCheckedChange={() => toggleFilter(type.id)}
                  />
                  <Label htmlFor={type.id} className="text-sm font-normal cursor-pointer">
                    {type.label}
                  </Label>
                </div>
                <span className="text-xs text-muted-foreground">({type.count})</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            filterStats.categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={selectedFilters.includes(category.id)}
                    onCheckedChange={() => toggleFilter(category.id)}
                  />
                  <Label htmlFor={category.id} className="text-sm font-normal cursor-pointer">
                    {category.label}
                  </Label>
                </div>
                <span className="text-xs text-muted-foreground">({category.count})</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Experience Level */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Experience Level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            filterStats.experience.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={exp.id}
                    checked={selectedFilters.includes(exp.id)}
                    onCheckedChange={() => toggleFilter(exp.id)}
                  />
                  <Label htmlFor={exp.id} className="text-sm font-normal cursor-pointer">
                    {exp.label}
                  </Label>
                </div>
                <span className="text-xs text-muted-foreground">({exp.count})</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Urgency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hiring Urgency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            filterStats.urgency.map((urg) => (
              <div key={urg.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={urg.id}
                    checked={selectedFilters.includes(urg.id)}
                    onCheckedChange={() => toggleFilter(urg.id)}
                  />
                  <Label htmlFor={urg.id} className="text-sm font-normal cursor-pointer">
                    {urg.label}
                  </Label>
                </div>
                <span className="text-xs text-muted-foreground">({urg.count})</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
