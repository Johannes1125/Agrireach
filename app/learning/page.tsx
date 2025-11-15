import { PageTransition } from "@/components/ui/page-transition";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Catalog from "@/components/learning/catalog.client";
import LearningStats from "@/components/learning/learning-stats";
import LearningProgress from "@/components/learning/learning-progress";
import RecommendedCourses from "@/components/learning/recommended-courses";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LearningPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        {/* Enhanced Hero Header */}
        <div className="bg-gradient-to-r from-primary/90 via-primary to-primary/80 text-primary-foreground border-b-2 border-primary/20">
          <div className="container mx-auto px-4 py-10 sm:py-16">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
                  E-Learning & Training Center
                </h1>
                <p className="text-sm sm:text-base text-primary-foreground/90 max-w-2xl">
                  Master agricultural skills, earn certifications, and unlock new opportunities with our comprehensive training programs.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Quick Stats Cards */}
              <LearningStats user={user} />

              {/* Course Catalog */}
              <Card className="border-2 p-6">
                <Catalog />
              </Card>

              {/* Recommended Courses */}
              <RecommendedCourses userId={user.id} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* My Learning Progress */}
              <LearningProgress userId={user.id} />
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
