"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import {
  SKILL_CATEGORIES,
  SkillCategory,
  CATEGORY_COLORS,
  Skill,
  SkillLevel,
  getAllSkills,
  getSkillCategory,
} from "@/lib/skills";
import { SkillLevelSelector } from "./skill-level-selector";

interface SkillSelectorProps {
  selectedSkills: Skill[];
  onAddSkill: (skill: Skill) => void;
  onRemoveSkill: (skillName: string) => void;
  availableSkills?: string[]; // Optional: limit available skills
  showCustomInput?: boolean;
  className?: string;
}

export function SkillSelector({
  selectedSkills,
  onAddSkill,
  onRemoveSkill,
  availableSkills,
  showCustomInput = true,
  className = "",
}: SkillSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>("Crop Farming");
  const [searchQuery, setSearchQuery] = useState("");
  const [customSkillName, setCustomSkillName] = useState("");
  const [customSkillLevel, setCustomSkillLevel] = useState<SkillLevel>(2);
  const [showLevelSelector, setShowLevelSelector] = useState<string | null>(null);

  const selectedSkillNames = selectedSkills.map((s) => s.name.toLowerCase());

  const getAvailableSkillsForCategory = (category: SkillCategory): string[] => {
    const categorySkills = Array.from(SKILL_CATEGORIES[category]);
    if (availableSkills) {
      return categorySkills.filter((skill) => availableSkills.includes(skill));
    }
    return categorySkills;
  };

  const filteredSkills = getAvailableSkillsForCategory(selectedCategory).filter(
    (skill) =>
      !selectedSkillNames.includes(skill.toLowerCase()) &&
      skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSkill = (skillName: string, level?: SkillLevel) => {
    const category = getSkillCategory(skillName) || selectedCategory;
    const skill: Skill = {
      name: skillName,
      level: level || 2,
      category,
    };
    onAddSkill(skill);
    setShowLevelSelector(null);
  };

  const handleAddCustomSkill = () => {
    if (customSkillName.trim()) {
      handleAddSkill(customSkillName.trim(), customSkillLevel);
      setCustomSkillName("");
      setCustomSkillLevel(2);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as SkillCategory)}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
          {(Object.keys(SKILL_CATEGORIES) as SkillCategory[]).map((category) => {
            const colorClass = CATEGORY_COLORS[category];
            return (
              <TabsTrigger
                key={category}
                value={category}
                className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category.split(" ")[0]}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Skills by Category */}
        {(Object.keys(SKILL_CATEGORIES) as SkillCategory[]).map((category) => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${category.toLowerCase()} skills...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Skills Grid */}
              {filteredSkills.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredSkills.map((skill) => (
                    <Card
                      key={skill}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (showLevelSelector === skill) {
                          setShowLevelSelector(null);
                        } else {
                          setShowLevelSelector(skill);
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{skill}</span>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {showLevelSelector === skill && (
                          <div className="mt-2 pt-2 border-t">
                            <SkillLevelSelector
                              value={customSkillLevel}
                              onChange={(level) => {
                                handleAddSkill(skill, level);
                              }}
                              label=""
                              className="text-xs"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery
                    ? `No skills found matching "${searchQuery}"`
                    : "All skills in this category have been added"}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Custom Skill Input */}
      {showCustomInput && (
        <div className="space-y-2 pt-4 border-t">
          <Label>Add Custom Skill</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter a custom skill name"
              value={customSkillName}
              onChange={(e) => setCustomSkillName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomSkill();
                }
              }}
              className="flex-1"
            />
            <SkillLevelSelector
              value={customSkillLevel}
              onChange={setCustomSkillLevel}
              label=""
              className="w-40"
            />
            <Button type="button" onClick={handleAddCustomSkill} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

