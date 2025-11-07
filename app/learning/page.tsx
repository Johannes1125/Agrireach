import { SimpleHeader } from "@/components/layout/simple-header";
import { PageTransition } from "@/components/ui/page-transition";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Catalog from "@/components/learning/catalog.client";
import LearningStats from "@/components/learning/learning-stats";
import LearningProgress from "@/components/learning/learning-progress";
import RecommendedCourses from "@/components/learning/recommended-courses";

export default async function LearningPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />

      <PageTransition>
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white">
          <div className="container mx-auto px-4 py-8 sm:py-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              E-Learning & Training Center
            </h1>
            <p className="text-sm sm:text-base text-green-50 max-w-2xl">
              Master agricultural skills, earn certifications, and unlock new opportunities with our comprehensive training programs.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Quick Stats Cards */}
              <LearningStats user={user} />

              {/* Course Catalog */}
              <Catalog />

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
