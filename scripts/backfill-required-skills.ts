import { connectToDatabase } from "../server/lib/mongodb";
import { Opportunity } from "../server/models/Job";
import { normalizeSkillRequirements, SkillRequirement } from "../lib/skills";

async function run() {
  await connectToDatabase();

  const legacyJobs = await Opportunity.find({
    required_skills: {
      $exists: true,
      $ne: [],
    },
  })
    .select({ required_skills: 1 })
    .lean();

  const updates: Array<{ id: any; skills: SkillRequirement[] }> = [];

  for (const job of legacyJobs) {
    const skills = job.required_skills;
    if (!Array.isArray(skills) || skills.length === 0) continue;

    if (typeof skills[0] === "string" || !("name" in skills[0])) {
      const normalized = normalizeSkillRequirements(skills as any);
      updates.push({ id: job._id, skills: normalized });
    }
  }

  if (updates.length === 0) {
    console.log("No legacy opportunities found. Nothing to update.");
    return process.exit(0);
  }

  console.log(`Found ${updates.length} opportunities to backfill.`);

  const bulk = updates.map((entry) => ({
    updateOne: {
      filter: { _id: entry.id },
      update: { $set: { required_skills: entry.skills } },
    },
  }));

  const result = await Opportunity.bulkWrite(bulk, { ordered: false });
  console.log(`Backfill complete. Updated ${result.modifiedCount} opportunities.`);

  process.exit(0);
}

run().catch((err) => {
  console.error("Backfill failed", err);
  process.exit(1);
});

