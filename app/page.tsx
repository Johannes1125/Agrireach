"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sprout,
  Users,
  MapPin,
  TrendingUp,
  Shield,
  Globe,
  Briefcase,
  ShoppingCart,
  MessageSquare,
  Star,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  ArrowRight,
  CheckCircle,
  Award,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useFeaturedProductsData } from "@/hooks/use-featured-products-data";
import { useCommunityData } from "@/hooks/use-community-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

interface Opportunity {
  _id: string;
  title: string;
  location: string;
  pay_rate?: number;
  company_name?: string;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  reviewer_id: {
    full_name: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface HomeStats {
  totalJobs: number;
  totalProducts: number;
  totalUsers: number;
  totalReviews: number;
  averageRating: number;
}

export default function HomePage() {
  const { products: featuredProducts, loading: productsLoading } =
    useFeaturedProductsData(3);
  const { stats: communityStats } = useCommunityData();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Enhanced smooth scroll handler with easing
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 80; // Height of sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      // Use requestAnimationFrame for smoother animation
      const startPosition = window.pageYOffset;
      const distance = offsetPosition - startPosition;
      const duration = 800; // 800ms for smooth transition
      let start: number | null = null;

      const easeInOutCubic = (t: number): number => {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      const animation = (currentTime: number) => {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easeInOutCubic(progress);

        window.scrollTo(0, startPosition + distance * ease);

        if (timeElapsed < duration) {
          requestAnimationFrame(animation);
        }
      };

      requestAnimationFrame(animation);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [oppsRes, reviewsRes, statsRes] = await Promise.all([
          fetch("/api/opportunities?limit=3&status=active&sortBy=newest"),
          fetch("/api/reviews?limit=3&status=active&sortBy=highest"),
          fetch("/api/reviews/statistics"),
        ]);

        if (oppsRes.ok) {
          const oppsData = await oppsRes.json();
          const items = oppsData?.data?.items || oppsData?.items || [];
          setOpportunities(items.slice(0, 3));
        }

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          const reviewsList =
            reviewsData?.data?.reviews || reviewsData?.reviews || [];
          setReviews(reviewsList.slice(0, 3));
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          const statsInfo = statsData?.data || statsData;
          setStats({
            totalJobs: 0,
            totalProducts: 0,
            totalUsers: communityStats?.totalMembers || 0,
            totalReviews: statsInfo.totalReviews || 0,
            averageRating: statsInfo.averageRating || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [communityStats]);

  return (
    <div className="min-h-screen bg-background" style={{ scrollBehavior: 'smooth' }}>
      {/* 1. Header / Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sprout className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <Link href="/">
                <span className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-primary">
              AgriReach
            </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-6">
              <a
                href="#opportunities"
                onClick={(e) => handleSmoothScroll(e, "opportunities")}
                className="transition-opacity hover:opacity-80"
              >
                <Button variant="ghost" size="sm" className="text-sm">Opportunities</Button>
              </a>
              <a
                href="#marketplace"
                onClick={(e) => handleSmoothScroll(e, "marketplace")}
                className="transition-opacity hover:opacity-80"
              >
                <Button variant="ghost" size="sm" className="text-sm">Marketplace</Button>
              </a>
              <a
                href="#community"
                onClick={(e) => handleSmoothScroll(e, "community")}
                className="transition-opacity hover:opacity-80"
              >
                <Button variant="ghost" size="sm" className="text-sm">Community</Button>
              </a>
              <a
                href="#reviews"
                onClick={(e) => handleSmoothScroll(e, "reviews")}
                className="transition-opacity hover:opacity-80"
              >
                <Button variant="ghost" size="sm" className="text-sm">Reviews</Button>
              </a>
          </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
            <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-sm">Sign In</Button>
            </Link>
            <Link href="/auth/register">
                <Button size="sm" className="text-sm">Get Started</Button>
              </Link>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full" aria-hidden="true">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2">
                      <Sprout className="h-6 w-6 text-primary" />
                      <span className="font-heading text-xl font-bold text-primary">
              AgriReach
            </span>
          </div>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex-1 px-4 py-6 space-y-1">
                    <a
                      href="#opportunities"
                      onClick={(e) => {
                        handleSmoothScroll(e, "opportunities");
                        setMobileMenuOpen(false);
                      }}
                      className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Opportunities
                    </a>
                    <a
                      href="#marketplace"
                      onClick={(e) => {
                        handleSmoothScroll(e, "marketplace");
                        setMobileMenuOpen(false);
                      }}
                      className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Marketplace
                    </a>
                    <a
                      href="#community"
                      onClick={(e) => {
                        handleSmoothScroll(e, "community");
                        setMobileMenuOpen(false);
                      }}
                      className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Community
                    </a>
                    <a
                      href="#reviews"
                      onClick={(e) => {
                        handleSmoothScroll(e, "reviews");
                        setMobileMenuOpen(false);
                      }}
                      className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Reviews
                    </a>
                  </nav>

                  {/* Action Buttons */}
                  <div className="px-4 pb-6 pt-4 border-t space-y-3">
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button variant="outline" className="w-full" size="lg">
                Sign In
              </Button>
            </Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button className="w-full" size="lg">
                        Get Started
                      </Button>
            </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <Badge
              variant="secondary"
              className="mb-4 sm:mb-6 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1"
            >
            Supporting UN Sustainable Development Goals
          </Badge>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black leading-tight text-balance mb-4 sm:mb-6 px-2">
            Connecting Rural Workers with{" "}
            <span className="text-primary">Opportunities</span>
          </h1>
            <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed mb-6 sm:mb-8 px-4">
              Empowering farmers, fishers, and artisans in Central Luzon,
              Philippines to build sustainable livelihoods while preserving
              traditional skills and boosting rural economies.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                  Get Started Free
              </Button>
            </Link>
              <Link href="/marketplace" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-transparent"
              >
                  Explore Marketplace
              </Button>
            </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Key Features / Services */}
      <section className="px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
              Everything You Need to Succeed
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Comprehensive tools and services designed for the agricultural
              community in Central Luzon
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-3 sm:mb-4" />
                <CardTitle className="font-heading text-lg sm:text-xl">
                  Job Opportunities
                </CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Find agricultural work that matches your skills. Smart
                  matching connects you with the right opportunities in Central
                  Luzon.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-3 sm:mb-4" />
                <CardTitle className="font-heading text-lg sm:text-xl">
                  Marketplace
                </CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Buy and sell agricultural products directly. No middlemen, fair
                  prices, secure transactions with PayMongo integration.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-3 sm:mb-4" />
                <CardTitle className="font-heading text-lg sm:text-xl">
                  Community Forums
                </CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Connect with fellow farmers, share knowledge, and learn best
                  practices from experienced agricultural professionals.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-3 sm:mb-4" />
                <CardTitle className="font-heading text-lg sm:text-xl">
                  Trust & Safety
                </CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Verified profiles, rating system, and secure payments ensure
                  safe and reliable transactions for everyone.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. About / Introduction */}
      <section className="px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                Empowering Rural Communities in Central Luzon
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                AgriReach is a comprehensive platform designed to bridge the
                gap between rural agricultural workers and opportunities. We
                focus on Region III (Central Luzon), supporting farmers,
                fishers, and artisans across 7 provinces.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                Our mission is to create sustainable connections that benefit
                both workers and employers while promoting eco-friendly
                agricultural practices and preserving traditional skills.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base">Verified Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base">Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base">24/7 Support</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 order-1 md:order-2">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    {stats?.totalUsers.toLocaleString() || "1,000+"}
                  </div>
                  <CardDescription className="text-xs sm:text-sm">Active Members</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    {opportunities.length}+
                  </div>
                  <CardDescription className="text-xs sm:text-sm">Job Opportunities</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    {featuredProducts.length}+
                  </div>
                  <CardDescription className="text-xs sm:text-sm">Products Listed</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    <div className="text-2xl sm:text-3xl font-bold text-primary">
                      {stats?.averageRating.toFixed(1) || "4.5"}
                    </div>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    Average Rating ({stats?.totalReviews || 0} reviews)
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities Section */}
      <section id="opportunities" className="px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                Latest Opportunities
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                New job postings in Central Luzon
              </p>
            </div>
            <Link href="/opportunities">
              <Button variant="ghost" size="sm" className="text-sm">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          {opportunities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {opportunities.map((job) => (
                <Link key={job._id} href={`/opportunities/${job._id}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {job.pay_rate && (
                        <div className="text-lg font-semibold text-primary">
                          ₱{job.pay_rate.toLocaleString()}
                          {job.company_name && (
                            <span className="text-sm font-normal text-muted-foreground block mt-1">
                              {job.company_name}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No opportunities available at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Marketplace Section */}
      <section id="marketplace" className="px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-24 scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                Featured Products
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Fresh agricultural products from Central Luzon farmers
              </p>
            </div>
            <Link href="/marketplace">
              <Button variant="ghost" size="sm" className="text-sm">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-40 sm:h-48 bg-muted rounded-t-lg" />
                  <CardHeader className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <Link key={product._id} href={`/marketplace/${product._id}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer h-full overflow-hidden">
                    <div className="relative h-40 sm:h-48 bg-muted">
                      <img
                        src={
                          (Array.isArray(product.images) &&
                            product.images[0]) ||
                          (typeof product.images === "string"
                            ? product.images
                            : null) ||
                          "/placeholder.svg"
                        }
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      {product.status === "active" && (
                        <Badge
                          className="absolute top-2 right-2"
                          variant="secondary"
                        >
                          Available
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base sm:text-lg line-clamp-2">
                        {product.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{product.seller_id?.location || "Central Luzon"}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-lg sm:text-xl font-bold text-primary">
                          ₱{product.price?.toLocaleString() || "0"}
                          <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">
                            /{product.unit || "kg"}
                          </span>
                        </div>
                        {product.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs sm:text-sm">
                              {product.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-1">
                        Seller: {product.seller_id?.full_name || "Unknown"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No products available at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Join Our Community
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Connect with fellow farmers, share knowledge, and learn from experienced agricultural professionals in Central Luzon
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-3 sm:mb-4" />
                <CardTitle className="font-heading text-lg sm:text-xl">
                  Active Discussions
                </CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Join conversations about farming techniques, crop management, and agricultural best practices.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-3 sm:mb-4" />
                <CardTitle className="font-heading text-lg sm:text-xl">
                  Growing Network
                </CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  {communityStats?.totalMembers || "1,000+"} active members sharing knowledge and supporting each other.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="p-4 sm:p-6">
                <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-3 sm:mb-4" />
                <CardTitle className="font-heading text-lg sm:text-xl">
                  Latest Topics
                </CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Stay updated with trending discussions and popular topics in the agricultural community.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div className="text-center mt-6 sm:mt-8">
            <Link href="/community">
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8">
                Explore Community <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-24 scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              What Our Community Says
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-4">
              Real reviews from farmers, workers, and buyers using AgriReach
            </p>
          </div>
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {reviews.map((review) => (
                <Card key={review._id} className="h-full">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarImage
                          src={
                            review.reviewer_id?.avatar_url || "/placeholder.svg"
                          }
                        />
                        <AvatarFallback className="text-xs sm:text-sm">
                          {review.reviewer_id?.full_name
                            ?.charAt(0)
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm sm:text-base truncate">
                          {review.reviewer_id?.full_name || "Anonymous"}
                        </CardTitle>
                        <div className="flex items-center gap-0.5 sm:gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${
                                i < review.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-xs sm:text-sm leading-relaxed line-clamp-4">
                      {review.comment}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No reviews available at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* 8. Newsletter Signup */}
      <section className="px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="text-center p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2">
                Stay Updated
              </CardTitle>
              <CardDescription className="text-sm sm:text-base px-2">
                Get the latest job opportunities and marketplace updates
                delivered to your inbox
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    if (email) {
                      // In a real app, this would subscribe the user
                      alert("Thank you for subscribing!");
                      setEmail("");
                    }
                  }}
                >
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 7. Footer / Contact */}
      <footer className="border-t bg-background py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Sprout className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="font-heading text-base sm:text-lg font-bold text-primary">
                AgriReach
              </span>
            </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Empowering rural communities in Central Luzon, Philippines
                through sustainable agricultural connections.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link href="/opportunities" className="text-muted-foreground hover:text-primary">
                    Opportunities
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace" className="text-muted-foreground hover:text-primary">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="text-muted-foreground hover:text-primary">
                    Community
                  </Link>
                </li>
                <li>
                  <Link href="/reviews" className="text-muted-foreground hover:text-primary">
                    Reviews
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link href="/settings" className="text-muted-foreground hover:text-primary">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/accessibility" className="text-muted-foreground hover:text-primary">
                    Accessibility
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Contact</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-all">support@agrireach.ph</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>+63 XXX XXX XXXX</span>
                </li>
                <li className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4">
                  <a href="#" className="hover:text-primary transition-colors">
                    <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                  <a href="#" className="hover:text-primary transition-colors">
                    <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                  <a href="#" className="hover:text-primary transition-colors">
                    <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground px-4">
            <p>
              © 2024 AgriReach. All rights reserved. Empowering rural communities
              in Central Luzon, Philippines.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

