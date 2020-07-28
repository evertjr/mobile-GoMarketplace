import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // TODO LOAD ITEMS FROM ASYNC STORAGE

      const data = await AsyncStorage.getItem('@GoMarketplace:cartData');

      if (data) {
        setProducts(JSON.parse(data));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      // INCREMENTS A PRODUCT QUANTITY IN THE CART, SAVES ON STORAGE
      const productId = products.findIndex(p => p.id === id);

      const newArr = products;
      newArr[productId].quantity += 1;

      await AsyncStorage.setItem(
        '@GoMarketplace:cartData',
        JSON.stringify(newArr),
      );

      setProducts([...newArr]);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      // DECREMENTS A PRODUCT QUANTITY IN THE CART, REMOVE FROM CART IF DECREMENT BELOW 1
      const productId = products.findIndex(p => p.id === id);

      const newArr = products;
      newArr[productId].quantity -= 1;

      if (products[productId].quantity < 1) {
        // newArr[productId].quantity = 1;
        newArr.splice(productId, 1);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cartData',
        JSON.stringify(newArr),
      );

      setProducts([...newArr]);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      // ADD A NEW ITEM TO THE CART, INCREMENT IF ITS ALREARY ON CART

      const productId = products.findIndex(p => p.id === product.id);

      if (!productId) {
        await increment(product.id);
        return;
      }

      const newProduct = { ...product, quantity: 1 };
      const data = [...products, newProduct];

      await AsyncStorage.setItem(
        '@GoMarketplace:cartData',
        JSON.stringify(data),
      );

      setProducts(data);
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
