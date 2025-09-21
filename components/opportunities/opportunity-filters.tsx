"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { useState } from "react";

export function OpportunityFilters() {
  const [payRange, setPayRange] = useState([15, 30]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const jobTypes = [
    { id: "full-time", label: "Full-time", count: 89 },
    { id: "part-time", label: "Part-time", count: 45 },
    { id: "seasonal", label: "Seasonal", count: 156 },
    { id: "contract", label: "Contract", count: 67 },
    { id: "temporary", label: "Temporary", count: 34 },
  ];

  const categories = [
    { id: "crop-farming", label: "Crop Farming", count: 78 },
    { id: "livestock", label: "Livestock Care", count: 45 },
    { id: "equipment", label: "Equipment Operation", count: 56 },
    { id: "harvesting", label: "Harvesting", count: 89 },
    { id: "packaging", label: "Packaging & Processing", count: 34 },
    { id: "management", label: "Farm Management", count: 23 },
  ];

  const experience = [
    { id: "entry", label: "Entry Level (0-1 years)", count: 67 },
    { id: "mid", label: "Mid Level (2-5 years)", count: 89 },
    { id: "senior", label: "Senior Level (5+ years)", count: 45 },
  ];

  const urgency = [
    { id: "immediate", label: "Immediate Start", count: 34 },
    { id: "urgent", label: "Urgent Hiring", count: 56 },
    { id: "standard", label: "Standard Timeline", count: 123 },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
    setPayRange([15, 30]);
  };

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {selectedFilters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Active Filters
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {selectedFilters.map((filterId) => (
                <Badge
                  key={filterId}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {filterId.replace("-", " ")}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter(filterId)}
                  />
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
              max={50}
              min={10}
              step={1}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${payRange[0]}/hour</span>
            <span>${payRange[1]}/hour</span>
          </div>
        </CardContent>
      </Card>

      {/* Job Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobTypes.map((type) => (
            <div key={type.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={selectedFilters.includes(type.id)}
                  onCheckedChange={() => toggleFilter(type.id)}
                />
                <Label
                  htmlFor={type.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
              <span className="text-xs text-muted-foreground">
                ({type.count})
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={selectedFilters.includes(category.id)}
                  onCheckedChange={() => toggleFilter(category.id)}
                />
                <Label
                  htmlFor={category.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {category.label}
                </Label>
              </div>
              <span className="text-xs text-muted-foreground">
                ({category.count})
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Experience Level */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Experience Level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {experience.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={exp.id}
                  checked={selectedFilters.includes(exp.id)}
                  onCheckedChange={() => toggleFilter(exp.id)}
                />
                <Label
                  htmlFor={exp.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {exp.label}
                </Label>
              </div>
              <span className="text-xs text-muted-foreground">
                ({exp.count})
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Urgency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hiring Urgency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {urgency.map((urg) => (
            <div key={urg.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={urg.id}
                  checked={selectedFilters.includes(urg.id)}
                  onCheckedChange={() => toggleFilter(urg.id)}
                />
                <Label
                  htmlFor={urg.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {urg.label}
                </Label>
              </div>
              <span className="text-xs text-muted-foreground">
                ({urg.count})
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
