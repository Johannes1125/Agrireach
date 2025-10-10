# Loading Components Guide

This guide explains how to use the various loading components and animations in the AgriReach application.

## Overview

The application includes comprehensive loading states powered by:
- **Framer Motion** - Smooth animations and transitions
- **React Spinners** - Beautiful loading indicators
- Built-in Next.js loading states

## Components

### 1. Page-Level Loading (`loading.tsx` files)

Next.js automatically shows these loading components while a page is loading.

**Example locations:**
- `app/admin/loading.tsx`
- `app/marketplace/loading.tsx`
- `app/community/loading.tsx`

These use the `PageLoader` component with different variants.

### 2. PageLoader Component

Full-screen loading overlay with multiple variants.

**Usage:**
```tsx
import { PageLoader } from "@/components/ui/page-loader"

// Basic usage
<PageLoader text="Loading..." variant="spinner" />

// Available variants
<PageLoader variant="spinner" /> // Default spinning loader
<PageLoader variant="pulse" />   // Pulsing dots
<PageLoader variant="bounce" />  // Bouncing loader
<PageLoader variant="dots" />    // Animated dots

// Size options
<PageLoader size="sm" />  // Small (30px)
<PageLoader size="md" />  // Medium (50px) - default
<PageLoader size="lg" />  // Large (70px)
```

### 3. InlineLoader Component

For loading states within components (not full-screen).

**Usage:**
```tsx
import { InlineLoader } from "@/components/ui/page-loader"

<InlineLoader text="Loading data..." variant="pulse" size="sm" />
```

### 4. Skeleton Loaders

For content placeholders while data is loading.

**Usage:**
```tsx
import { 
  Skeleton, 
  CardSkeleton, 
  ProductCardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton 
} from "@/components/ui/skeleton-loader"

// Basic skeleton
<Skeleton className="h-4 w-full" />

// Pre-built skeletons
<CardSkeleton />
<ProductCardSkeleton />
<TableSkeleton rows={5} />
<ListSkeleton items={3} />
<FormSkeleton />
```

### 5. LoadingButton Component

Button with built-in loading state.

**Usage:**
```tsx
import { LoadingButton } from "@/components/ui/loading-button"

function MyComponent() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await submitData()
    setLoading(false)
  }

  return (
    <LoadingButton 
      loading={loading}
      loadingText="Submitting..."
      onClick={handleSubmit}
    >
      Submit
    </LoadingButton>
  )
}
```

### 6. LoadingOverlay Component

Overlay that can be applied to any component.

**Usage:**
```tsx
import { LoadingOverlay } from "@/components/ui/loading-overlay"

<LoadingOverlay loading={isLoading} text="Processing...">
  <YourContent />
</LoadingOverlay>
```

### 7. Global Loading (useLoading Hook)

For app-wide loading states.

**Usage:**
```tsx
"use client"
import { useLoading } from "@/hooks/use-loading"

function MyComponent() {
  const { showLoading, hideLoading, withLoading } = useLoading()

  // Manual control
  const handleAction = async () => {
    showLoading("Processing your request...")
    await doSomething()
    hideLoading()
  }

  // Automatic with promise
  const handleAutoAction = async () => {
    await withLoading(
      doSomethingAsync(),
      "Loading data..."
    )
  }

  return <button onClick={handleAction}>Do Something</button>
}
```

### 8. Page Transitions

Smooth animations when navigating between pages.

**Usage:**
```tsx
import { 
  PageTransition, 
  FadeTransition, 
  SlideTransition,
  ScaleTransition 
} from "@/components/ui/page-transition"

// Default page transition (fade + slide up)
export default function MyPage() {
  return (
    <PageTransition>
      <YourPageContent />
    </PageTransition>
  )
}

// Fade only
<FadeTransition>
  <Content />
</FadeTransition>

// Slide from direction
<SlideTransition direction="left">
  <Content />
</SlideTransition>

// Scale animation
<ScaleTransition>
  <Content />
</ScaleTransition>
```

## Common Patterns

### 1. Loading Data on Page Load

```tsx
"use client"
import { useState, useEffect } from "react"
import { InlineLoader } from "@/components/ui/page-loader"
import { PageTransition } from "@/components/ui/page-transition"

export default function MyPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData().then((result) => {
      setData(result)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <InlineLoader text="Loading data..." />
  }

  return (
    <PageTransition>
      {/* Your content */}
    </PageTransition>
  )
}
```

### 2. Form Submission with Loading

```tsx
"use client"
import { useState } from "react"
import { LoadingButton } from "@/components/ui/loading-button"

export default function MyForm() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await submitForm()
      // Success handling
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <LoadingButton 
        type="submit" 
        loading={loading}
        loadingText="Submitting..."
      >
        Submit
      </LoadingButton>
    </form>
  )
}
```

### 3. List with Skeleton Loading

```tsx
"use client"
import { useState, useEffect } from "react"
import { ListSkeleton } from "@/components/ui/skeleton-loader"
import { PageTransition } from "@/components/ui/page-transition"

export default function ItemList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems().then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <ListSkeleton items={5} />
  }

  return (
    <PageTransition>
      {items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </PageTransition>
  )
}
```

### 4. Component with Loading Overlay

```tsx
"use client"
import { useState } from "react"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

export default function MyComponent() {
  const [loading, setLoading] = useState(false)

  const refreshData = async () => {
    setLoading(true)
    await fetchData()
    setLoading(false)
  }

  return (
    <LoadingOverlay loading={loading} text="Refreshing...">
      <div>
        {/* Your content */}
        <button onClick={refreshData}>Refresh</button>
      </div>
    </LoadingOverlay>
  )
}
```

## Best Practices

1. **Use appropriate loading states:**
   - Full-page loading: `PageLoader` (for route changes)
   - Inline loading: `InlineLoader` (for component data)
   - Skeleton loading: Various skeleton components (for content placeholders)
   - Button loading: `LoadingButton` (for actions)

2. **Provide context:**
   - Always include descriptive loading text
   - Use specific messages like "Loading products..." instead of just "Loading..."

3. **Optimize user experience:**
   - Use skeleton loaders for content that will appear in the same location
   - Use spinners for actions and operations
   - Keep loading states minimal and unobtrusive

4. **Accessibility:**
   - All loading components include proper ARIA attributes
   - Screen readers will announce loading states
   - Keyboard navigation is maintained during loading

5. **Performance:**
   - Use `Suspense` boundaries in Next.js for automatic loading states
   - Implement progressive loading for large datasets
   - Cache data when appropriate to reduce loading times

## Animation Customization

All components use Framer Motion. You can customize animations:

```tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  {/* Your content */}
</motion.div>
```

## Troubleshooting

**Loading state persists:**
- Ensure you're calling `hideLoading()` or setting loading state to `false`
- Check for errors that might prevent the loading state from being cleared

**Animations not working:**
- Verify `"use client"` directive is at the top of the file
- Check that framer-motion is properly installed

**Theme-related issues:**
- Loading components automatically adapt to light/dark themes
- Ensure ThemeProvider is properly set up in your app layout

