export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  price: number;
  rating: number;
  ratingCount: number;
  stock: number;
  description: string;
  pages: number;
  publisher: string;
  year: number;
}

export interface CartItem {
  book: Book;
  qty: number;
}

export interface OrderItemInput {
  bookId: number;
  qty: number;
}

export interface CheckoutFields {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin: string;
}

export interface OrderInput extends CheckoutFields {
  items: OrderItemInput[];
}

export interface OrderConfirmation {
  orderNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  items: { title: string; author: string; qty: number; unitPrice: number }[];
}
