# V0 to Supabase Bridge Guide

This guide explains how to connect your v0 components to the Supabase database.

## Files Created

### 1. `components/YourV0Component.tsx`
Placeholder component where you'll paste your v0 component code. Replace the placeholder with your actual component.

### 2. `types/supabase.ts`
TypeScript types for all database tables:
- `profiles` - User profiles
- `wishlists` - User wishlists
- `wishlist_items` - Items in wishlists
- `group_gifts` - Group gifting campaigns
- `contributions` - Contributions to items/gifts

### 3. React Hooks (Client-Side)
- `hooks/use-wishlists.ts` - Manage wishlists with loading/error states
- `hooks/use-wishlist-items.ts` - Manage wishlist items with loading/error states

### 4. Server Actions (Server-Side)
- `app/actions/wishlist-actions.ts` - Server-side wishlist operations

## How to Use

### Step 1: Analyze Your V0 Component

Identify what your component does:
- **Buttons/Forms** → Likely needs to create/update data
- **Data Display** → Likely needs to fetch data
- **Lists/Tables** → Likely needs to fetch and display multiple records

### Step 2: Identify the Database Table

Based on your component's purpose:

| Component Purpose | Database Table | Hook to Use |
|------------------|----------------|-------------|
| Display/create wishlists | `wishlists` | `useWishlists()` |
| Display/add items to wishlist | `wishlist_items` | `useWishlistItems(wishlistId)` |
| User profile management | `profiles` | Create custom hook |
| Group gifting | `group_gifts` | Create custom hook |
| Contributions | `contributions` | Create custom hook |

### Step 3: Connect Your Component

#### Example: Component with Wishlist Form

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWishlists } from "@/hooks/use-wishlists"
import { useToast } from "@/hooks/use-toast"

export function YourV0Component() {
  const { createWishlist, loading } = useWishlists()
  const { toast } = useToast()
  const [title, setTitle] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createWishlist({
        title,
        description: null,
        is_public: false,
      })
      setTitle("")
    } catch (error) {
      // Error is already handled by the hook with toast
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Wishlist title"
        disabled={loading}
      />
      <Button type="submit" disabled={loading} className="h-12">
        {loading ? "Creating..." : "Create Wishlist"}
      </Button>
    </form>
  )
}
```

#### Example: Component Displaying Wishlist Items

```tsx
"use client"

import { useWishlistItems } from "@/hooks/use-wishlist-items"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function WishlistItemsDisplay({ wishlistId }: { wishlistId: string }) {
  const { items, loading, error } = useWishlistItems(wishlistId)

  if (loading) {
    return <Skeleton className="h-32 w-full" />
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <h3>{item.product_name}</h3>
          <p>${item.product_price}</p>
        </Card>
      ))}
    </div>
  )
}
```

### Step 4: Using Server Actions (Alternative)

For server components or when you need server-side operations:

```tsx
import { createWishlistAction } from "@/app/actions/wishlist-actions"
import { Button } from "@/components/ui/button"

export async function ServerWishlistForm() {
  async function handleSubmit(formData: FormData) {
    "use server"
    
    const result = await createWishlistAction({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      is_public: false,
    })

    if (result.error) {
      // Handle error
    }
  }

  return (
    <form action={handleSubmit}>
      <input name="title" />
      <Button type="submit">Create</Button>
    </form>
  )
}
```

## Available Hooks

### `useWishlists()`

Returns:
- `wishlists: Wishlist[]` - Array of wishlists
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `refetch: () => Promise<void>` - Refetch wishlists
- `createWishlist: (data: WishlistInsert) => Promise<Wishlist>` - Create new wishlist
- `updateWishlist: (id: string, data: WishlistUpdate) => Promise<Wishlist>` - Update wishlist
- `deleteWishlist: (id: string) => Promise<void>` - Delete wishlist

### `useWishlistItems(wishlistId?: string)`

Returns:
- `items: WishlistItem[]` - Array of items
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `refetch: () => Promise<void>` - Refetch items
- `createItem: (data: WishlistItemInsert) => Promise<WishlistItem>` - Add new item
- `updateItem: (id: string, data: WishlistItemUpdate) => Promise<WishlistItem>` - Update item
- `deleteItem: (id: string) => Promise<void>` - Delete item

## Type Safety

All types are available from `@/types/supabase`:

```tsx
import type {
  Wishlist,
  WishlistItem,
  WishlistInsert,
  WishlistItemInsert,
  WishlistUpdate,
  WishlistItemUpdate,
} from "@/types/supabase"
```

## Error Handling

All hooks automatically:
- Show toast notifications on errors
- Set error state
- Handle authentication checks

You can also manually handle errors:

```tsx
try {
  await createWishlist(data)
} catch (error) {
  // Error already shown in toast, but you can add custom handling
  console.error("Custom error handling:", error)
}
```

## Loading States

Always use the `loading` state from hooks to show loading indicators:

```tsx
<Button disabled={loading} className="h-12">
  {loading ? <Loader2 className="animate-spin" /> : "Submit"}
</Button>
```

## Mobile Requirements

Remember to follow the mobile button requirements:
- Minimum height: `h-12` (48px)
- Touch target: At least 44x44px
- Example: `h-12 px-4 sm:px-6`

## Next Steps

1. Paste your v0 component code into `components/YourV0Component.tsx`
2. Identify which database tables your component needs
3. Import and use the appropriate hooks
4. Replace mock data with real database calls
5. Add loading and error states
6. Test on mobile devices

## Need Help?

If your component needs a different table or operation:
1. Check `types/supabase.ts` for available tables
2. Create a new hook following the pattern in `hooks/use-wishlists.ts`
3. Create server actions following the pattern in `app/actions/wishlist-actions.ts`

