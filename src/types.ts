export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'smartphones' | 'laptops' | 'audio' | 'wearables' | 'gaming' | 'smarthome' | 'accessories';
  price: number; // in INR
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  fastDelivery: string;
  tags: string[];
  specs: Record<string, string>;
  images: string[];
  description: string;
  warranty: string;
  emiStarting: number;
  madeInIndia?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  type: 'home' | 'work';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  addresses?: Address[];
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponDiscount: number;
  couponCode?: string;
  deliveryFee: number;
  gstAmount: number;
  total: number;
  address: Address;
  paymentMethod: string;
  paymentId?: string;
  razorpayOrderId?: string;
  zapupiOrderId?: string;
  zapupiTxnId?: string;
  utr?: string;
  paidAt?: string;
  paymentEnvironment?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'Placed' | 'Confirmed' | 'Packed' | 'Dispatched' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  courier: string;
  trackingNumber: string;
  estimatedDeliveryDate: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendedProductIds?: string[];
}

export type CategoryKey = 'all' | 'smartphones' | 'laptops' | 'audio' | 'wearables' | 'gaming' | 'smarthome' | 'accessories';

export interface FilterOptions {
  category: CategoryKey;
  searchQuery: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'discount';
  onlyInStock: boolean;
  onlyMadeInIndia: boolean;
}

export interface Review {
  id?: string;
  _id?: string;
  productId: string;
  userId?: string;
  userName: string;
  userCity?: string;
  rating: number;
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt?: string;
  productName?: string;
  productBrand?: string;
  productImage?: string;
}

export interface ProductRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

