import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  AlertCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Product, AuthUser, Review, ProductRatingStats } from '../types';
import { formatINR } from '../utils/format';
import { POPULAR_PINCODES } from '../data/products';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  currentPincode: string;
  token?: string | null;
  user?: AuthUser | null;
  onRequireAuth?: () => void;
  onProductUpdated?: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  currentPincode,
  token,
  user,
  onRequireAuth,
  onProductUpdated,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'emi' | 'warranty' | 'reviews'>('specs');
  const [checkPincode, setCheckPincode] = useState(currentPincode);
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ProductRatingStats | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [userHasPurchased, setUserHasPurchased] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  // Review Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Fetch reviews for the product
  const fetchReviews = async () => {
    if (!product) return;
    setLoadingReviews(true);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/products/${product.id}/reviews`, { headers });
      if (!res.ok) throw new Error('Failed to load reviews');
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setStats({
          averageRating: data.averageRating,
          totalReviews: data.totalReviews,
          ratingDistribution: data.ratingDistribution,
        });
        setUserHasPurchased(Boolean(data.userHasPurchased));
        setUserReview(data.userReview || null);
      }
    } catch (err: any) {
      console.warn('Error fetching reviews:', err.message);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      fetchReviews();
      setIsFormOpen(false);
      setEditingReviewId(null);
      setReviewError(null);
      setReviewSuccess(null);
    }
  }, [isOpen, product?.id, token]);

  if (!isOpen || !product) return null;

  const handlePincodeCheck = () => {
    if (checkPincode.length === 6 && /^\d+$/.test(checkPincode)) {
      const pinInfo = POPULAR_PINCODES[checkPincode];
      if (pinInfo) {
        setPincodeMessage(`Express Delivery available to ${pinInfo.city} within ${pinInfo.days} day(s). Cash on Delivery eligible.`);
      } else {
        setPincodeMessage(`Standard Delivery available to PIN ${checkPincode} in 2-3 business days via BlueDart.`);
      }
    } else {
      setPincodeMessage('Please enter a valid 6-digit Indian PIN code.');
    }
  };

  const handleOpenEdit = (rev: Review) => {
    setEditingReviewId(rev._id || rev.id || '');
    setFormRating(rev.rating);
    setFormTitle(rev.title || '');
    setFormComment(rev.comment);
    setIsFormOpen(true);
    setReviewError(null);
    setReviewSuccess(null);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete your review?')) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete review');

      setReviewSuccess('Your review has been removed.');
      setUserReview(null);
      await fetchReviews();

      if (onProductUpdated && data.stats) {
        onProductUpdated({
          ...product,
          rating: data.stats.averageRating,
          reviewCount: data.stats.totalReviews,
        });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      onRequireAuth?.();
      return;
    }

    if (formComment.trim().length < 5) {
      setReviewError('Review comment must be at least 5 characters long.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);

    try {
      const url = editingReviewId
        ? `/api/reviews/${editingReviewId}`
        : `/api/products/${product.id}/reviews`;
      const method = editingReviewId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: formRating,
          title: formTitle.trim(),
          comment: formComment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setReviewSuccess(
        editingReviewId
          ? 'Your review has been updated successfully!'
          : 'Thank you! Your verified customer review has been published.'
      );
      setIsFormOpen(false);
      setEditingReviewId(null);
      setFormTitle('');
      setFormComment('');
      setFormRating(5);
      await fetchReviews();

      if (onProductUpdated && data.stats) {
        onProductUpdated({
          ...product,
          rating: data.stats.averageRating,
          reviewCount: data.stats.totalReviews,
        });
      }
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Generate simulated EMI plans
  const emiPlans = [
    { months: 3, perMonth: Math.round(product.price / 3), bank: 'HDFC Bank', interest: '0% (No Cost)' },
    { months: 6, perMonth: Math.round(product.price / 6), bank: 'ICICI Bank', interest: '0% (No Cost)' },
    { months: 9, perMonth: Math.round(product.price / 9), bank: 'SBI Card', interest: '0% (No Cost)' },
    { months: 12, perMonth: Math.round(product.price / 12), bank: 'Axis Bank', interest: '0% (No Cost)' },
  ];

  const currentDisplayRating = stats?.averageRating ?? product.rating;
  const currentDisplayCount = stats?.totalReviews ?? product.reviewCount;

  return (
    <div className="fixed inset-0 z-50 bg-bazaaro-dark/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-bazaaro-surface rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700/50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {product.brand}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider">
              ID: {product.id.toUpperCase()}
            </span>
            {product.madeInIndia && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 ml-2">
                🇮🇳 Made in India
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* Left: Gallery */}
            <div className="space-y-4">
              <div className="aspect-4/3 rounded-2xl bg-[#F5F5F7] p-8 flex items-center justify-center relative overflow-hidden isolate">
                <img
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain mix-blend-multiply"
                />
                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`absolute top-4 right-4 p-2.5 rounded-full transition-colors cursor-pointer ${
                    isWishlisted ? 'bg-rose-50 text-rose-500' : 'bg-white/80 text-slate-400 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl border p-1 overflow-hidden transition-all cursor-pointer bg-white isolate ${
                        selectedImageIndex === idx ? 'border-slate-800 shadow-sm' : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain mix-blend-multiply" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust assurances for Indian shoppers */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50 text-center text-xs text-slate-400">
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <ShieldCheck className="w-4 h-4 text-slate-300 mx-auto mb-2" />
                  <span className="font-semibold text-slate-200 block text-[11px]">Brand Warranty</span>
                  <span className="text-[10px] text-slate-500">1 Year Pan-India</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <RotateCcw className="w-4 h-4 text-slate-300 mx-auto mb-2" />
                  <span className="font-semibold text-slate-200 block text-[11px]">7 Days Return</span>
                  <span className="text-[10px] text-slate-500">Hassle-Free</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <CreditCard className="w-4 h-4 text-slate-300 mx-auto mb-2" />
                  <span className="font-semibold text-slate-200 block text-[11px]">Secure Payments</span>
                  <span className="text-[10px] text-slate-500">Instant UPI</span>
                </div>
              </div>
            </div>

            {/* Right: Info & Pricing */}
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 leading-tight">
                {product.name}
              </h2>

              {/* Rating header */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-900 font-semibold px-2 py-0.5 rounded text-xs">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{currentDisplayRating}</span>
                </div>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs text-slate-400 hover:text-slate-200 font-medium underline underline-offset-4 transition-colors cursor-pointer"
                >
                  {currentDisplayCount} Customer Reviews & Ratings
                </button>
              </div>

              {/* Price */}
              <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-semibold text-slate-50 tracking-tight">
                    {formatINR(product.price)}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-slate-500 line-through font-medium">
                      M.R.P.: {formatINR(product.originalPrice)}
                    </span>
                  )}
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-600 text-white">
                    {product.discountPercent}% OFF
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Inclusive of all taxes (GST 18% inclusive invoice provided). Free delivery on this order.
                </p>

                {/* Instant Bank Offer */}
                <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-3 text-xs text-slate-300 font-medium">
                  <span className="px-1.5 py-0.5 rounded bg-slate-700 text-[10px] font-bold">OFFER</span>
                  <span>Instant ₹3,000 off on HDFC & ICICI Credit Card EMI transactions.</span>
                </div>
              </div>

              {/* Pincode checker */}
              <div className="p-5 rounded-2xl border border-slate-700/50 bg-slate-800/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>Check Delivery Date to Your Pincode:</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={checkPincode}
                    onChange={(e) => setCheckPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN"
                    className="flex-1 px-4 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg outline-hidden focus:border-slate-500 transition-colors"
                  />
                  <button
                    onClick={handlePincodeCheck}
                    className="px-5 py-2 bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </div>
                {pincodeMessage && (
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{pincodeMessage}</span>
                  </p>
                )}
              </div>

              {/* CTAs */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => onAddToCart(product)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={() => onBuyNow(product)}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>

          {/* Tabbed Info Section */}
          <div className="border-t border-slate-700/50 pt-8">
            <div className="flex border-b border-slate-700/50 gap-8 text-sm font-semibold overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'specs' ? 'border-slate-200 text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('emi')}
                className={`pb-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'emi' ? 'border-slate-200 text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                No Cost EMI Plans
              </button>
              <button
                onClick={() => setActiveTab('warranty')}
                className={`pb-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'warranty' ? 'border-slate-200 text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Domestic Warranty
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'reviews' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>Customer Reviews</span>
                <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-bazaaro-dark border border-bazaaro-border text-slate-400 font-bold">
                  {currentDisplayCount}
                </span>
              </button>
            </div>

            <div className="pt-4">
              {/* 1. Specifications Tab */}
              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="p-3 bg-bazaaro-dark border border-bazaaro-border/50 rounded-xl flex justify-between gap-4">
                      <span className="font-semibold text-slate-400">{key}</span>
                      <span className="font-bold text-slate-200 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. EMI Tab */}
              {activeTab === 'emi' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Avail 0% interest No Cost EMI on leading credit cards with zero down payment.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {emiPlans.map((plan) => (
                      <div key={plan.months} className="p-3 rounded-xl border border-slate-200 bg-white flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{formatINR(plan.perMonth)} x {plan.months} Months</div>
                          <div className="text-[11px] text-slate-500">{plan.bank} • {plan.interest}</div>
                        </div>
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded text-[11px]">
                          0% Interest
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Warranty Tab */}
              {activeTab === 'warranty' && (
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-4 rounded-xl bg-violet-900/20 border border-violet-500/30 flex items-start gap-3 shadow-[inset_0_2px_8px_rgba(139,92,246,0.05)]">
                    <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm mb-1">Official Brand Warranty Policy</h4>
                      <p className="text-slate-400 leading-relaxed">{product.warranty}</p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Includes free doorstep pick-up and drop for service across 450+ cities.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Customer Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Feedback alerts */}
                  {reviewSuccess && (
                    <div className="p-3.5 bg-emerald-900/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center justify-between shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{reviewSuccess}</span>
                      </div>
                      <button onClick={() => setReviewSuccess(null)} className="text-emerald-500 hover:text-emerald-400 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Rating Breakdown Card */}
                  <div className="bg-bazaaro-dark border border-bazaaro-border/80 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                    {/* Left: Overall score */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-bazaaro-border/50 pb-4 md:pb-0 md:pr-4">
                      <div className="text-4xl font-black text-cyan-400 tracking-tight drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                        {currentDisplayRating}
                      </div>
                      <div className="flex items-center gap-1 my-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(currentDisplayRating)
                                ? 'fill-cyan-400 text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 font-medium font-mono">
                        Based on {currentDisplayCount} verified logs
                      </p>
                    </div>

                    {/* Right: 1-5 Star Breakdown */}
                    <div className="md:col-span-8 space-y-1.5 text-xs">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = stats?.ratingDistribution?.[star as 1 | 2 | 3 | 4 | 5] || 0;
                        const total = stats?.totalReviews || (count > 0 ? count : 1);
                        const percent = stats?.totalReviews ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="w-12 text-slate-400 font-medium flex items-center gap-1">
                              <span>{star}</span>
                              <Star className="w-3 h-3 fill-cyan-500 text-cyan-500" />
                            </span>
                            <div className="flex-1 bg-black h-2 rounded-full overflow-hidden border border-bazaaro-border/50">
                              <div
                                className="bg-cyan-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-slate-500 font-mono text-[11px]">
                              {percent}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Eligibility & Write Review Action Section */}
                  <div className="p-4 rounded-2xl bg-bazaaro-surface border border-bazaaro-border/80 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                    {!token ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-300">
                          <MessageSquare className="w-4 h-4 text-cyan-500 shrink-0" />
                          <span>Acquired this hardware? Sign in to submit a verified review.</span>
                        </div>
                        <button
                          onClick={onRequireAuth}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-bazaaro-dark font-bold rounded-xl transition-colors shrink-0 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                        >
                          Initialize Login
                        </button>
                      </div>
                    ) : userHasPurchased ? (
                      <div>
                        {userReview && !isFormOpen ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 text-emerald-400">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="font-semibold">Log recorded ({userReview.rating}★).</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEdit(userReview)}
                                className="px-3 py-1.5 text-xs font-semibold bg-bazaaro-dark border border-bazaaro-border hover:bg-black text-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit Log</span>
                              </button>
                              <button
                                onClick={() => handleDeleteReview(userReview._id || userReview.id || '')}
                                className="px-3 py-1.5 text-xs font-semibold bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border border-rose-500/30 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Purge</span>
                              </button>
                            </div>
                          </div>
                        ) : !isFormOpen ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="text-xs">
                              <span className="font-bold text-slate-100 block flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                Verified Purchaser Eligible
                              </span>
                              <span className="text-slate-400">
                                You hold ownership of this hardware. Submit your analytics to the network.
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setIsFormOpen(true);
                                setEditingReviewId(null);
                                setFormRating(5);
                                setFormTitle('');
                                setFormComment('');
                                setReviewError(null);
                              }}
                              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-bazaaro-dark font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Submit Log</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 text-xs text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0" />
                        <span>
                          <strong className="text-slate-300">Verified Logs Only:</strong> Only customers who have ordered and paid for this product can submit analytics.
                        </span>
                      </div>
                    )}

                    {/* Write/Edit Review Form Drawer */}
                    {isFormOpen && (
                      <form onSubmit={handleSubmitReview} className="mt-4 pt-4 border-t border-bazaaro-border/50 space-y-4 text-xs animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-100 text-sm">
                            {editingReviewId ? 'Edit Your Network Log' : 'Initialize a New Analytics Log'}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setIsFormOpen(false);
                              setEditingReviewId(null);
                            }}
                            className="text-slate-500 hover:text-cyan-400 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {reviewError && (
                          <div className="p-3 bg-rose-900/20 border border-rose-500/30 rounded-xl text-rose-400 flex items-center gap-2 text-xs shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{reviewError}</span>
                          </div>
                        )}

                        {/* Interactive Star Picker */}
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-300 block">
                            Performance Rating (1 to 5) *
                          </label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const activeStar = formHoverRating || formRating;
                              return (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setFormRating(star)}
                                  onMouseEnter={() => setFormHoverRating(star)}
                                  onMouseLeave={() => setFormHoverRating(0)}
                                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      star <= activeStar
                                        ? 'fill-cyan-400 text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]'
                                        : 'text-slate-600'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                            <span className="ml-2 text-xs font-bold text-slate-400 font-mono">
                              {formRating === 5 && '5 Stars — Excellent'}
                              {formRating === 4 && '4 Stars — Very Good'}
                              {formRating === 3 && '3 Stars — Average'}
                              {formRating === 2 && '2 Stars — Below Average'}
                              {formRating === 1 && '1 Star — Poor'}
                            </span>
                          </div>
                        </div>

                        {/* Title input */}
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-300 block">
                            Header Sequence (Optional)
                          </label>
                          <input
                            type="text"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="e.g. Exceptional optics and battery life, instant transfer!"
                            className="w-full px-3.5 py-2 bg-black border border-bazaaro-border rounded-xl focus:border-cyan-500 focus:outline-hidden text-xs text-slate-200 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]"
                            maxLength={100}
                          />
                        </div>

                        {/* Comment input */}
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-300 block">
                            Analytics Payload * (Min 5 chars)
                          </label>
                          <textarea
                            rows={3}
                            value={formComment}
                            onChange={(e) => setFormComment(e.target.value)}
                            placeholder="Detail your operational experience with build quality, thermals, packaging, and real-world execution..."
                            className="w-full px-3.5 py-2 bg-black border border-bazaaro-border rounded-xl focus:border-cyan-500 focus:outline-hidden text-xs text-slate-200 resize-none shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]"
                            required
                            minLength={5}
                            maxLength={1000}
                          />
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>Req: 5 chars</span>
                            <span>{formComment.length} / 1000</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsFormOpen(false);
                              setEditingReviewId(null);
                            }}
                            className="px-3.5 py-2 bg-bazaaro-dark hover:bg-bazaaro-surface border border-bazaaro-border text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Abort
                          </button>
                          <button
                            type="submit"
                            disabled={reviewSubmitting}
                            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-bazaaro-dark font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer flex items-center gap-1.5"
                          >
                            {reviewSubmitting ? (
                              <span>Encrypting...</span>
                            ) : (
                              <span>{editingReviewId ? 'Update Analytics' : 'Transmit Log'}</span>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Network Analytics ({reviews.length})</span>
                      <span>Verified Purchases Marked [SECURE]</span>
                    </div>

                    {loadingReviews ? (
                      <div className="p-8 text-center text-xs text-cyan-500/50 animate-pulse font-mono">
                        FETCHING NETWORK LOGS...
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-black border border-bazaaro-border/50 text-center space-y-2 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-semibold text-slate-300">No logs found in this sector.</p>
                        <p className="text-[11px] text-slate-500">
                          Be the first verified purchaser to review for this hardware.
                        </p>
                      </div>
                    ) : (
                      reviews.map((rev) => {
                        const isOwnReview = Boolean(user && rev.userId && rev.userId.toString() === user.id);
                        return (
                          <div
                            key={rev._id || rev.id}
                            className="p-4 rounded-2xl bg-black border border-bazaaro-border space-y-2.5 transition-all hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                          >
                            {/* Review Top Row */}
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-200 text-xs">
                                    {rev.userName}
                                  </span>
                                  {rev.userCity && (
                                    <span className="text-[11px] text-slate-500">
                                      • {rev.userCity}
                                    </span>
                                  )}
                                  {rev.verifiedPurchase && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                      Verified Purchase
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center text-cyan-500">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-3 h-3 ${
                                          star <= rev.rating
                                            ? 'fill-cyan-400 text-cyan-400 drop-shadow-[0_0_3px_rgba(6,182,212,0.5)]'
                                            : 'text-slate-700'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </div>
                              </div>

                              {/* Action controls for owner */}
                              {isOwnReview && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEdit(rev)}
                                    title="Edit your log"
                                    className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-black rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReview(rev._id || rev.id || '')}
                                    title="Purge log"
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Review Title & Comment */}
                            {rev.title && (
                              <h5 className="font-bold text-cyan-400 text-xs font-mono uppercase">
                                &gt; {rev.title}
                              </h5>
                            )}
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line border-l-2 border-bazaaro-border/50 pl-2">
                              {rev.comment}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
