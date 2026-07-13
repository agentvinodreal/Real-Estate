import React, { createContext, useContext, useState, useEffect } from 'react'

export type CartItem = {
  id: string // prefix-itemId (e.g. material-cuid)
  itemId: string
  name: string
  type: 'Material' | 'Equipment' | 'ServiceProvider'
  roleOrCategory: string
  price: number
  unit: string
  qty: number
  duration?: number // only for equipment and service providers
}

type CartContextType = {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'qty' | 'duration'>, qty: number, duration?: number) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  updateDuration: (id: string, duration: number) => void
  clearCart: () => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggleCart: () => void
  cartCount: number
  cartSubtotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('carry_cart')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('carry_cart', JSON.stringify(items))
  }, [items])

  const addToCart = (product: Omit<CartItem, 'qty' | 'duration'>, qty: number, duration?: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + qty, duration: duration !== undefined ? duration : item.duration }
            : item
        )
      }
      return [...prev, { ...product, qty, duration }]
    })
    setIsOpen(true) // auto open cart on add
  }

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id)
      return
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, qty } : item)))
  }

  const updateDuration = (id: string, duration: number) => {
    if (duration <= 0) return
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, duration } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  const toggleCart = () => setIsOpen((prev) => !prev)

  const cartCount = items.reduce((acc, item) => acc + item.qty, 0)

  const cartSubtotal = items.reduce((acc, item) => {
    const rate = item.price
    const itemQty = item.qty
    const days = item.duration ?? 1
    return acc + rate * itemQty * days
  }, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateDuration,
        clearCart,
        isOpen,
        setIsOpen,
        toggleCart,
        cartCount,
        cartSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
