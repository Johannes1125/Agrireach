"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Skill, SKILL_LEVELS, SKILL_LEVEL_COLORS, CATEGORY_COLORS, SkillCategory } from "@/lib/skills";
import { Button } from "@/components/ui/button";

interface SkillCardProps {
  skill: Skill;
  onRemove?: () => void;
  showCategory?: boolean;
  showLevel?: boolean;
  className?: string;
}

export function SkillCard({
  skill,
  onRemove,
  showCategory = true,
  showLevel = true,
  className = "",
}: SkillCardProps) {
  const levelLabel = SKILL_LEVELS[skill.level as keyof typeof SKILL_LEVELS];
  const levelColor = SKILL_LEVEL_COLORS[skill.level as keyof typeof SKILL_LEVEL_COLORS];
  const categoryColor = CATEGORY_COLORS[skill.category as SkillCategory] || CATEGORY_COLORS["Farm Management"];

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${className}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{skill.name}</span>
          {showCategory && (
            <Badge variant="outline" className={`text-xs ${categoryColor}`}>
              {skill.category}
            </Badge>
          )}
          {showLevel && (
            <Badge variant="outline" className={`text-xs ${levelColor}`}>
              {levelLabel}
            </Badge>
          )}
        </div>
      </div>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

