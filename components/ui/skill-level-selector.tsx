"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SkillLevel, SKILL_LEVELS, SKILL_LEVEL_COLORS } from "@/lib/skills";
import { Badge } from "@/components/ui/badge";

interface SkillLevelSelectorProps {
  value: SkillLevel;
  onChange: (level: SkillLevel) => void;
  label?: string;
  className?: string;
}

export function SkillLevelSelector({
  value,
  onChange,
  label = "Proficiency Level",
  className = "",
}: SkillLevelSelectorProps) {
  const levelColor = SKILL_LEVEL_COLORS[value];

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      <Select
        value={value.toString()}
        onValueChange={(val) => onChange(parseInt(val) as SkillLevel)}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={levelColor}>
                {SKILL_LEVELS[value]}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SKILL_LEVELS) as Array<keyof typeof SKILL_LEVELS>).map((level) => {
            const levelNum = parseInt(level) as SkillLevel;
            const levelColor = SKILL_LEVEL_COLORS[levelNum];
            return (
              <SelectItem key={level} value={level}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={levelColor}>
                    {SKILL_LEVELS[levelNum]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {levelNum === 1 && "Basic knowledge"}
                    {levelNum === 2 && "Some experience"}
                    {levelNum === 3 && "Proficient"}
                    {levelNum === 4 && "Highly skilled"}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

