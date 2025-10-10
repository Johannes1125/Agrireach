# Loading Components - Quick Reference

## Most Common Use Cases

### 1. Page Loading (Automatic)
Create `loading.tsx` in your route folder:

```tsx
import { PageLoader } from "@/components/ui/page-loader"

export default function Loading() {
  return <PageLoader text="Loading..." variant="spinner" />
}
```

### 2. Data Fetching with Skeleton
```tsx
"use client"
import { ProductCardSkeleton } from "@/components/ui/skeleton-loader"

export default function Products() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchProducts().then(data => {
      setProducts(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    )
  }

  return <ProductGrid products={products} />
}
```

### 3. Form Submission
```tsx
"use client"
import { LoadingButton } from "@/components/ui/loading-button"

export default function MyForm() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await submitData()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <LoadingButton loading={loading} loadingText="Saving...">
        Save
      </LoadingButton>
    </form>
  )
}
```

### 4. Global Loading (Any Operation)
```tsx
"use client"
import { useLoading } from "@/hooks/use-loading"

export default function MyComponent() {
  const { withLoading } = useLoading()

  const handleAction = async () => {
    await withLoading(
      performAsyncOperation(),
      "Processing your request..."
    )
  }

  return <button onClick={handleAction}>Do Something</button>
}
```

### 5. Component Loading Overlay
```tsx
"use client"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

export default function DataTable() {
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    await refetchData()
    setLoading(false)
  }

  return (
    <LoadingOverlay loading={loading} text="Refreshing...">
      <table>{/* table content */}</table>
    </LoadingOverlay>
  )
}
```

### 6. Page Transitions
```tsx
"use client"
import { PageTransition } from "@/components/ui/page-transition"

export default function MyPage() {
  return (
    <PageTransition>
      {/* Your page content */}
    </PageTransition>
  )
}
```

## Component Import Reference

```tsx
// Loaders
import { PageLoader, InlineLoader } from "@/components/ui/page-loader"

// Skeletons
import { 
  Skeleton,
  CardSkeleton,
  ProductCardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton
} from "@/components/ui/skeleton-loader"

// Buttons
import { LoadingButton } from "@/components/ui/loading-button"

// Overlays
import { LoadingOverlay, FullScreenLoading } from "@/components/ui/loading-overlay"

// Transitions
import { 
  PageTransition,
  FadeTransition,
  SlideTransition,
  ScaleTransition
} from "@/components/ui/page-transition"

// Hooks
import { useLoading } from "@/hooks/use-loading"
```

## Loading Variants

| Variant | Visual | Best For |
|---------|--------|----------|
| `spinner` | Circular spinner | General loading, default |
| `pulse` | Pulsing dots | Background operations |
| `bounce` | Bouncing ball | Fun, casual contexts |
| `dots` | Animated dots | Inline text loading |

## Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| `sm` | 20-30px | Inline, buttons |
| `md` | 30-50px | Default |
| `lg` | 50-70px | Full-page loading |

## Tips

1. **Always provide descriptive text** for better UX
2. **Use skeletons** for content that appears in the same location
3. **Use spinners** for operations and actions
4. **Wrap promises** with `withLoading()` for automatic state management
5. **Add page transitions** for professional feel

## Demo

Visit `/demo/loading` to see all components in action!

## Full Documentation

See [LOADING_GUIDE.md](./LOADING_GUIDE.md) for complete documentation.

