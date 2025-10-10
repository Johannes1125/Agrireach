# 🎨 Loading Components - Visual Overview

## 📋 Component Catalog

### 1. Full-Screen Loaders

#### PageLoader
```tsx
<PageLoader text="Loading..." variant="spinner" size="md" />
```
**Use for:** Route-level loading, major page transitions
**Variants:** `spinner` | `pulse` | `bounce` | `dots`
**Sizes:** `sm` | `md` | `lg`

#### FullScreenLoading
```tsx
<FullScreenLoading loading={true} text="Processing..." />
```
**Use for:** Long operations, blocking actions

---

### 2. Inline Loaders

#### InlineLoader
```tsx
<InlineLoader text="Loading data..." variant="pulse" size="sm" />
```
**Use for:** Component-level loading, data fetching
**Best in:** Cards, sections, sidebars

---

### 3. Skeleton Loaders (Content Placeholders)

#### Basic Skeleton
```tsx
<Skeleton className="h-4 w-full" />
```

#### CardSkeleton
```tsx
<CardSkeleton />
```
**Includes:** Avatar, text lines, action buttons

#### ProductCardSkeleton
```tsx
<ProductCardSkeleton />
```
**Includes:** Image area, title, price, button

#### TableSkeleton
```tsx
<TableSkeleton rows={5} />
```
**Includes:** Header row + data rows

#### ListSkeleton
```tsx
<ListSkeleton items={3} />
```
**Includes:** Avatar + text per item

#### FormSkeleton
```tsx
<FormSkeleton />
```
**Includes:** Label + input fields + button

---

### 4. Interactive Components

#### LoadingButton
```tsx
<LoadingButton 
  loading={isLoading}
  loadingText="Saving..."
  onClick={handleClick}
>
  Save
</LoadingButton>
```
**Features:**
- Auto-disable during loading
- Shows spinner
- Optional loading text
- Supports all button variants

#### LoadingOverlay
```tsx
<LoadingOverlay loading={isLoading} text="Processing...">
  <YourContent />
</LoadingOverlay>
```
**Features:**
- Overlays any component
- Backdrop blur
- Non-intrusive

---

### 5. Page Transitions

#### PageTransition (Default)
```tsx
<PageTransition>
  <YourPage />
</PageTransition>
```
**Effect:** Fade + slide up

#### FadeTransition
```tsx
<FadeTransition>
  <YourPage />
</FadeTransition>
```
**Effect:** Simple fade

#### SlideTransition
```tsx
<SlideTransition direction="left">
  <YourPage />
</SlideTransition>
```
**Directions:** `left` | `right` | `up` | `down`

#### ScaleTransition
```tsx
<ScaleTransition>
  <YourPage />
</ScaleTransition>
```
**Effect:** Scale + fade

---

## 🎯 Usage by Scenario

### Scenario 1: Loading a Product List
```tsx
{loading ? (
  <div className="grid grid-cols-3 gap-4">
    <ProductCardSkeleton />
    <ProductCardSkeleton />
    <ProductCardSkeleton />
  </div>
) : (
  <ProductGrid products={products} />
)}
```

### Scenario 2: Form Submission
```tsx
<form onSubmit={handleSubmit}>
  {/* form fields */}
  <LoadingButton loading={isSubmitting} loadingText="Submitting...">
    Submit
  </LoadingButton>
</form>
```

### Scenario 3: Data Table with Refresh
```tsx
<LoadingOverlay loading={refreshing} text="Refreshing...">
  <DataTable data={data} />
</LoadingOverlay>
```

### Scenario 4: Global Operation
```tsx
const { withLoading } = useLoading()

await withLoading(
  fetchData(),
  "Loading data..."
)
```

### Scenario 5: Page with Transition
```tsx
export default function MyPage() {
  return (
    <PageTransition>
      <h1>My Page</h1>
      {/* content */}
    </PageTransition>
  )
}
```

---

## 📁 File Structure

```
components/ui/
├── page-loader.tsx          # PageLoader, InlineLoader
├── page-transition.tsx      # Page transition components
├── skeleton-loader.tsx      # All skeleton variants
├── loading-button.tsx       # LoadingButton
└── loading-overlay.tsx      # LoadingOverlay, FullScreenLoading

contexts/
└── loading-context.tsx      # Global loading state

hooks/
└── use-loading.ts          # useLoading hook

app/
├── layout.tsx              # LoadingProvider added here
├── admin/loading.tsx       # Route loading states
├── community/loading.tsx
├── marketplace/loading.tsx
├── notifications/loading.tsx
├── reviews/loading.tsx
└── demo/loading/page.tsx   # Interactive demo
```

---

## 🎨 Visual States

### Loading Variants

| Variant | Animation | Speed | Best For |
|---------|-----------|-------|----------|
| `spinner` | Rotating circle | Medium | General use, default |
| `pulse` | Pulsing dots | Slow | Background tasks |
| `bounce` | Bouncing ball | Fast | Fun contexts |
| `dots` | Sequential dots | Medium | Inline loading |

### Size Guide

| Size | Pixel Range | Usage |
|------|-------------|-------|
| `sm` | 20-30px | Buttons, inline text |
| `md` | 30-50px | Default, cards |
| `lg` | 50-70px | Full-page, important |

---

## 🔄 Animation Timings

- **Page transitions:** 400ms
- **Skeleton pulse:** 1500ms
- **Fade in/out:** 300ms
- **Scale:** 300ms
- **Slide:** 400ms

All animations use `ease-out` / `ease-in-out` for natural feel.

---

## 🎭 Theme Adaptation

All loaders automatically adapt to your theme:
- **Light mode:** Dark spinners on light background
- **Dark mode:** Light spinners on dark background
- Uses `useTheme()` from `next-themes`

---

## ⚡ Performance Notes

1. **Skeletons** - Lightweight, pure CSS animations
2. **Spinners** - Optimized with `react-spinners`
3. **Transitions** - GPU-accelerated via Framer Motion
4. **No layout shift** - Components maintain space during load

---

## 🎯 When to Use What

| Situation | Component | Why |
|-----------|-----------|-----|
| Page loading | `loading.tsx` with `PageLoader` | Automatic, covers whole page |
| Fetching data | `InlineLoader` or Skeletons | Shows where content will be |
| Form submit | `LoadingButton` | Clear action feedback |
| Table refresh | `LoadingOverlay` | Non-disruptive |
| Complex operation | `useLoading()` hook | Global state, custom text |
| Page change | `PageTransition` | Professional feel |

---

## 📱 Responsive Behavior

- Loaders scale appropriately on mobile
- Skeleton layouts adapt to screen size
- Touch-friendly loading states
- Reduced motion support (respects user preferences)

---

## ♿ Accessibility

✅ ARIA labels on all loaders
✅ Screen reader announcements
✅ Keyboard navigation maintained
✅ Focus management during loading
✅ Reduced motion support

---

## 🚀 Getting Started

1. **Test the demo:** Visit `/demo/loading`
2. **Copy examples:** Use code from `examples/loading-usage-example.tsx`
3. **Read guide:** Check `LOADING_GUIDE.md` for details
4. **Quick ref:** Use `LOADING_QUICK_REFERENCE.md` while coding

---

## 📚 Documentation Files

1. **LOADING_GUIDE.md** - Complete documentation
2. **LOADING_QUICK_REFERENCE.md** - Quick patterns
3. **LOADING_IMPLEMENTATION.md** - Technical details
4. **LOADING_SUMMARY.md** - What was added
5. **LOADING_COMPONENTS_OVERVIEW.md** - This file
6. **examples/loading-usage-example.tsx** - Code examples

---

## ✨ Quick Commands

```bash
# Run dev server
npm run dev

# Visit demo
http://localhost:3000/demo/loading

# Build
npm run build
```

---

**Everything is ready to use! No additional setup needed.** 🎉

