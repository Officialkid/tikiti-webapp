"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  eventId: string;
  eventTitle: string;
  ticketType: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (eventId: string, ticketType: string) => void;
  updateQuantity: (eventId: string, ticketType: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('tikiti-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tikiti-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((prev: CartItem[]) => {
      const existingIndex = prev.findIndex(
        (item: CartItem) =>
          item.eventId === newItem.eventId &&
          item.ticketType === newItem.ticketType
      );

      if (existingIndex > -1) {
        // Update quantity if item already exists
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      } else {
        // Add new item
        return [...prev, newItem];
      }
    });
  };

  const removeItem = (eventId: string, ticketType: string) => {
    setItems((prev: CartItem[]) =>
      prev.filter(
        (item: CartItem) => !(item.eventId === eventId && item.ticketType === ticketType)
      )
    );
  };

  const updateQuantity = (
    eventId: string,
    ticketType: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeItem(eventId, ticketType);
      return;
    }

    setItems((prev: CartItem[]) =>
      prev.map((item: CartItem) =>
        item.eventId === eventId && item.ticketType === ticketType
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
    0
  );

  const value: CartContextType = {
    items,
    itemCount,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
