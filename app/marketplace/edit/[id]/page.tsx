import { EditProductForm } from "@/components/marketplace/edit-product-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { requireBuyer, getCurrentUser } from "@/lib/auth-server"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

async function fetchProductData(id: string) {
  const h = await headers()
  const cookie = h.get("cookie") || ""
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/marketplace/products/${id}`, {
      headers: { Cookie: cookie },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      console.error(`Failed to fetch product ${id}: ${res.status} ${res.statusText}`)
      return null
    }
    const data = await res.json()
    return data.data?.product || data.product
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error)
    return null
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  // Require buyer role to edit products
  const user = await requireBuyer()
  
  const { id } = await params
  const product = await fetchProductData(id)

  if (!product) {
    notFound()
  }

  // Check if user is the owner of the product or is an admin
  const isAdmin = user.roles?.includes("admin")
  if (product.seller_id !== user.id && !isAdmin) {
    redirect("/marketplace")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-sans mb-2">Edit Product</h1>
          <p className="text-muted-foreground">Update your product listing details</p>
        </div>

        <EditProductForm product={product} />
      </div>
    </div>
  )
}

