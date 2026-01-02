"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Filter,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Star,
  Mail,
  Bell,
  User,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface AffiliateProduct {
  id: string
  productName: string
  image: string
  category: string
  source: string
  rating: number
  reviewCount: number
  price: number
  originalPrice?: number
  amazonChoice?: boolean
  bestSeller?: boolean
  productLink: string
  createdAt: string
  updatedAt: string
}

const ADMIN_EMAIL = "wishbeeai@gmail.com"

export default function AdminAffiliateProductsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<AffiliateProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSource, setSelectedSource] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("popularity")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AffiliateProduct | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    productName: "",
    image: "",
    category: "",
    source: "",
    rating: "",
    reviewCount: "",
    price: "",
    originalPrice: "",
    productLink: "",
    amazonChoice: false,
    bestSeller: false,
  })

  // Check admin access
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        router.push("/")
        toast.error("Access denied. Admin privileges required.")
      }
    }
  }, [user, authLoading, router])

  // Fetch affiliate products
  useEffect(() => {
    if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/affiliate-products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        toast.error("Failed to load affiliate products")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load affiliate products")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/affiliate-products/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Product deleted successfully")
        fetchProducts()
        setIsDeleteModalOpen(false)
        setDeletingProductId(null)
      } else {
        toast.error("Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    }
  }

  const resetForm = () => {
    setFormData({
      productName: "",
      image: "",
      category: "",
      source: "",
      rating: "",
      reviewCount: "",
      price: "",
      originalPrice: "",
      productLink: "",
      amazonChoice: false,
      bestSeller: false,
    })
  }

  const handleOpenAddModal = () => {
    resetForm()
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (product: AffiliateProduct) => {
    setEditingProduct(product)
    setFormData({
      productName: product.productName || "",
      image: product.image || "",
      category: product.category || "",
      source: product.source || "",
      rating: product.rating?.toString() || "",
      reviewCount: product.reviewCount?.toString() || "",
      price: product.price?.toString() || "",
      originalPrice: product.originalPrice?.toString() || "",
      productLink: product.productLink || "",
      amazonChoice: product.amazonChoice || false,
      bestSeller: product.bestSeller || false,
    })
    setIsEditModalOpen(true)
  }

  const handleSave = async () => {
    // Validate required fields
    if (!formData.productName.trim()) {
      toast.error("Product name is required")
      return
    }
    if (!formData.category.trim()) {
      toast.error("Category is required")
      return
    }
    if (!formData.source.trim()) {
      toast.error("Source is required")
      return
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      toast.error("Valid price is required")
      return
    }

    setIsSaving(true)
    try {
      const url = isEditModalOpen && editingProduct
        ? `/api/admin/affiliate-products/${editingProduct.id}`
        : "/api/admin/affiliate-products"

      const method = isEditModalOpen ? "PUT" : "POST"

      const payload: any = {
        productName: formData.productName.trim(),
        image: formData.image.trim() || undefined,
        category: formData.category.trim(),
        source: formData.source.trim(),
        rating: formData.rating ? parseFloat(formData.rating) : 0,
        reviewCount: formData.reviewCount ? parseInt(formData.reviewCount, 10) : 0,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        productLink: formData.productLink.trim() || undefined,
        amazonChoice: formData.amazonChoice,
        bestSeller: formData.bestSeller,
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(isEditModalOpen ? "Product updated successfully" : "Product added successfully")
        setIsAddModalOpen(false)
        setIsEditModalOpen(false)
        setEditingProduct(null)
        resetForm()
        fetchProducts()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save product")
      }
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("Failed to save product")
    } finally {
      setIsSaving(false)
    }
  }

  // Filter and sort products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSource = selectedSource === "all" || product.source.toLowerCase() === selectedSource.toLowerCase()

    return matchesSearch && matchesCategory && matchesSource
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "popularity":
        return b.reviewCount - a.reviewCount
      case "rating":
        return b.rating - a.rating
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "name":
        return a.productName.localeCompare(b.productName)
      default:
        return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage)

  // Get unique categories and sources
  const categories = Array.from(new Set(products.map((p) => p.category))).sort()
  const sources = Array.from(new Set(products.map((p) => p.source))).sort()

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#DAA520] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#654321] font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-[#8B4513]">
              WishBee
            </Link>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-[#8B4513]">
                <Mail className="w-5 h-5" />
              </button>
              <button className="relative p-2 text-gray-600 hover:text-[#8B4513]">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative">
                <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <User className="w-5 h-5" />
                  <span className="text-sm">{user.email}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title and Admin Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#654321] mb-2">Manage Affiliate Products</h1>
          <p className="text-sm text-gray-600 mb-4">
            Admin only page to add and manage affiliate products that appear in the Browse Gifts marketplace.
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#8B4513]">
              Admin Access Email: {ADMIN_EMAIL}
            </p>
            <Button
              onClick={handleOpenAddModal}
              className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] text-sm sm:text-base md:text-lg font-semibold h-12 px-4 sm:px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Affiliate Product
            </Button>
          </div>
        </div>

        {/* Stats and Filters */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#654321]">
              Affiliate Products ({filteredProducts.length})
            </h2>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search affiliate products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#DAA520]"
                />
              </div>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#DAA520] w-4 h-4 z-10 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white appearance-none cursor-pointer text-[#654321] text-sm min-w-[160px]"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#DAA520] w-4 h-4 z-10 pointer-events-none" />
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="pl-10 pr-8 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white appearance-none cursor-pointer text-[#654321] text-sm min-w-[160px]"
              >
                <option value="all">All Affiliate Sources</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#DAA520] w-4 h-4 z-10 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-8 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white appearance-none cursor-pointer text-[#654321] text-sm min-w-[140px]"
              >
                <option value="popularity">Sort by Popularity</option>
                <option value="rating">Sort by Rating</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-3 py-2 rounded-lg border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white cursor-pointer text-[#654321] text-sm"
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            {sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4 text-lg">
                  {products.length === 0
                    ? "No affiliate products yet. Add your first product to get started!"
                    : "No products match your filters. Try adjusting your search or filters."}
                </p>
                {products.length === 0 && (
                  <Button
                    onClick={handleOpenAddModal}
                    className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
                  </Button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Source</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Rating</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Reviews</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#654321]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.productName}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                        <div>
                          <div className="font-semibold text-[#654321] mb-1">{product.productName}</div>
                          <div className="text-sm text-gray-600">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-700">{product.source}</span>
                        {product.amazonChoice && (
                          <Badge className="bg-[#FF9900] text-white text-xs w-fit border-0">Amazon Choice</Badge>
                        )}
                        {product.bestSeller && (
                          <Badge className="bg-black text-white text-xs w-fit border-0">Amazon Best Seller</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-[#DAA520] text-[#DAA520]" />
                        <span className="font-semibold text-[#654321]">{product.rating}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {product.reviewCount.toLocaleString()} reviews
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {product.originalPrice && product.originalPrice > product.price ? (
                          <>
                            <span className="text-sm line-through text-gray-400">${product.originalPrice}</span>
                            <span className="font-bold text-[#654321]">${product.price}</span>
                          </>
                        ) : (
                          <span className="font-bold text-[#654321]">${product.price}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(product)}
                          className="border-[#DAA520] text-[#DAA520] hover:bg-[#DAA520] hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingProductId(product.id)
                            setIsDeleteModalOpen(true)
                          }}
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedProducts.length)} of {sortedProducts.length} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={
                        currentPage === pageNum
                          ? "bg-[#DAA520] text-white"
                          : "border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white"
                      }
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white"
                >
                  Next &gt;
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">Are you sure you want to delete this product? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setDeletingProductId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => deletingProductId && handleDelete(deletingProductId)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Product Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        setIsAddModalOpen(open)
        setIsEditModalOpen(open)
        if (!open) {
          setEditingProduct(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#654321]">
              {isEditModalOpen ? "Edit Product" : "Add New Affiliate Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-[#654321] mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="Enter product name"
                className="border-gray-300 focus:border-[#DAA520]"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-[#654321] mb-2">
                Image URL
              </label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="border-gray-300 focus:border-[#DAA520]"
              />
              {formData.image && (
                <img
                  src={formData.image}
                  alt="Preview"
                  className="mt-2 w-24 h-24 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[#654321] mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Electronics, Books"
                  className="border-gray-300 focus:border-[#DAA520]"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-[#654321] mb-2">
                  Source <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., Amazon, eBay"
                  className="border-gray-300 focus:border-[#DAA520]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-[#654321] mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="border-gray-300 focus:border-[#DAA520]"
                />
              </div>

              {/* Original Price */}
              <div>
                <label className="block text-sm font-medium text-[#654321] mb-2">
                  Original Price (optional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  placeholder="0.00"
                  className="border-gray-300 focus:border-[#DAA520]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-[#654321] mb-2">
                  Rating (0-5)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  placeholder="0.0"
                  className="border-gray-300 focus:border-[#DAA520]"
                />
              </div>

              {/* Review Count */}
              <div>
                <label className="block text-sm font-medium text-[#654321] mb-2">
                  Review Count
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.reviewCount}
                  onChange={(e) => setFormData({ ...formData, reviewCount: e.target.value })}
                  placeholder="0"
                  className="border-gray-300 focus:border-[#DAA520]"
                />
              </div>
            </div>

            {/* Product Link */}
            <div>
              <label className="block text-sm font-medium text-[#654321] mb-2">
                Product Link
              </label>
              <Input
                value={formData.productLink}
                onChange={(e) => setFormData({ ...formData, productLink: e.target.value })}
                placeholder="https://example.com/product"
                className="border-gray-300 focus:border-[#DAA520]"
              />
            </div>

            {/* Amazon Badges */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amazonChoice}
                  onChange={(e) => setFormData({ ...formData, amazonChoice: e.target.checked })}
                  className="w-4 h-4 text-[#DAA520] border-gray-300 rounded focus:ring-[#DAA520]"
                />
                <span className="text-sm text-[#654321]">Amazon Choice</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.bestSeller}
                  onChange={(e) => setFormData({ ...formData, bestSeller: e.target.checked })}
                  className="w-4 h-4 text-[#DAA520] border-gray-300 rounded focus:ring-[#DAA520]"
                />
                <span className="text-sm text-[#654321]">Best Seller</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setIsEditModalOpen(false)
                  setEditingProduct(null)
                  resetForm()
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
              >
                {isSaving ? "Saving..." : isEditModalOpen ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

