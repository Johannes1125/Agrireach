"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { PageLoader, InlineLoader } from "@/components/ui/page-loader"
import { 
  Skeleton, 
  CardSkeleton, 
  ProductCardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton 
} from "@/components/ui/skeleton-loader"
import { LoadingButton } from "@/components/ui/loading-button"
import { LoadingOverlay, FullScreenLoading } from "@/components/ui/loading-overlay"
import { 
  PageTransition, 
  FadeTransition, 
  SlideTransition,
  ScaleTransition 
} from "@/components/ui/page-transition"
import { useLoading } from "@/hooks/use-loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function LoadingDemoPage() {
  const [showPageLoader, setShowPageLoader] = useState(false)
  const [showFullScreen, setShowFullScreen] = useState(false)
  const [overlayLoading, setOverlayLoading] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)
  const [transition, setTransition] = useState<"page" | "fade" | "slide" | "scale">("page")
  const { showLoading, hideLoading, withLoading } = useLoading()

  const handlePageLoader = () => {
    setShowPageLoader(true)
    setTimeout(() => setShowPageLoader(false), 3000)
  }

  const handleFullScreen = () => {
    setShowFullScreen(true)
    setTimeout(() => setShowFullScreen(false), 3000)
  }

  const handleGlobalLoading = () => {
    showLoading("Processing your request...")
    setTimeout(() => hideLoading(), 3000)
  }

  const handleWithLoading = async () => {
    await withLoading(
      new Promise(resolve => setTimeout(resolve, 3000)),
      "Loading data..."
    )
  }

  const handleOverlayLoading = () => {
    setOverlayLoading(true)
    setTimeout(() => setOverlayLoading(false), 3000)
  }

  const handleButtonLoading = () => {
    setButtonLoading(true)
    setTimeout(() => setButtonLoading(false), 3000)
  }

  const TransitionWrapper = ({ children }: { children: React.ReactNode }) => {
    switch (transition) {
      case "fade":
        return <FadeTransition>{children}</FadeTransition>
      case "slide":
        return <SlideTransition direction="left">{children}</SlideTransition>
      case "scale":
        return <ScaleTransition>{children}</ScaleTransition>
      default:
        return <PageTransition>{children}</PageTransition>
    }
  }

  return (
    <div className="container py-8 space-y-8">
      <TransitionWrapper>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Loading Components Demo</h1>
          <p className="text-muted-foreground">
            Test all the loading states and animations available in the app
          </p>
        </div>

        <Separator />

        {/* Page Loaders */}
        <Card>
          <CardHeader>
            <CardTitle>Full-Screen Loaders</CardTitle>
            <CardDescription>
              Full-screen loading overlays with different variants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={handlePageLoader} variant="outline">
                Show PageLoader (Spinner)
              </Button>
              <Button onClick={handleFullScreen} variant="outline">
                Show FullScreen Loading
              </Button>
              <Button onClick={handleGlobalLoading} variant="outline">
                Show Global Loading
              </Button>
              <Button onClick={handleWithLoading} variant="outline">
                With Loading (Hook)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inline Loaders */}
        <Card>
          <CardHeader>
            <CardTitle>Inline Loaders (Framer Motion Only)</CardTitle>
            <CardDescription>
              Loading indicators powered by Framer Motion - no external spinner libraries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-2">Spinner Variant:</p>
              <InlineLoader variant="spinner" size="sm" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Dots Variant:</p>
              <InlineLoader variant="dots" size="sm" text="Loading data..." />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Bounce Variant:</p>
              <InlineLoader variant="bounce" size="md" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Progress Dots Variant:</p>
              <InlineLoader variant="progress" size="md" text="Please wait..." />
            </div>
          </CardContent>
        </Card>

        {/* Skeleton Loaders */}
        <Card>
          <CardHeader>
            <CardTitle>Skeleton Loaders</CardTitle>
            <CardDescription>
              Placeholder content while data is loading
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-2">Basic Skeletons:</p>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Card Skeleton:</p>
              <CardSkeleton />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Product Card Skeleton:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">List Skeleton:</p>
              <ListSkeleton items={3} />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Table Skeleton:</p>
              <TableSkeleton rows={3} />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Form Skeleton:</p>
              <FormSkeleton />
            </div>
          </CardContent>
        </Card>

        {/* Loading Button */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Button</CardTitle>
            <CardDescription>
              Button with built-in loading state
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <LoadingButton
                loading={buttonLoading}
                loadingText="Processing..."
                onClick={handleButtonLoading}
              >
                Click Me
              </LoadingButton>
              
              <LoadingButton
                loading={buttonLoading}
                onClick={handleButtonLoading}
                variant="outline"
              >
                No Loading Text
              </LoadingButton>
              
              <LoadingButton
                loading={buttonLoading}
                loadingText="Saving..."
                onClick={handleButtonLoading}
                variant="destructive"
              >
                Destructive
              </LoadingButton>
            </div>
          </CardContent>
        </Card>

        {/* Loading Overlay */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Overlay</CardTitle>
            <CardDescription>
              Overlay any component with a loading state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleOverlayLoading} className="mb-4">
              Trigger Overlay
            </Button>
            <LoadingOverlay loading={overlayLoading} text="Processing...">
              <div className="p-8 border rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold mb-2">Sample Content</h3>
                <p className="text-muted-foreground">
                  This content will be overlaid with a loading indicator when you click the button above.
                  The overlay includes a backdrop blur effect for better visual separation.
                </p>
              </div>
            </LoadingOverlay>
          </CardContent>
        </Card>

        {/* Page Transitions */}
        <Card>
          <CardHeader>
            <CardTitle>Page Transitions</CardTitle>
            <CardDescription>
              Different animation styles for page transitions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => setTransition("page")} 
                variant={transition === "page" ? "default" : "outline"}
              >
                Page Transition
              </Button>
              <Button 
                onClick={() => setTransition("fade")} 
                variant={transition === "fade" ? "default" : "outline"}
              >
                Fade
              </Button>
              <Button 
                onClick={() => setTransition("slide")} 
                variant={transition === "slide" ? "default" : "outline"}
              >
                Slide
              </Button>
              <Button 
                onClick={() => setTransition("scale")} 
                variant={transition === "scale" ? "default" : "outline"}
              >
                Scale
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Current transition: <strong>{transition}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Hidden loaders for demo */}
        {showPageLoader && <PageLoader text="Loading page..." variant="spinner" />}
        <FullScreenLoading loading={showFullScreen} text="Please wait..." />
      </TransitionWrapper>
    </div>
  )
}

