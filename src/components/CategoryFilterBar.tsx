import React from 'react';
import {
  LayoutGrid,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Gamepad2,
  Home,
  Cpu,
  SlidersHorizontal,
  ArrowDownUp,
  Check
} from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { CategoryKey, FilterOptions } from '../types';

interface CategoryFilterBarProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  availableBrands: string[];
  totalResults: number;
}

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  all: LayoutGrid,
  smartphones: Smartphone,
  laptops: Laptop,
  audio: Headphones,
  wearables: Watch,
  gaming: Gamepad2,
  smarthome: Home,
  accessories: Cpu,
};

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  filters,
  onFilterChange,
  availableBrands,
  totalResults,
}) => {
  const handleCategorySelect = (catKey: string) => {
    onFilterChange({
      ...filters,
      category: catKey as CategoryKey,
    });
  };

  const handleBrandSelect = (brand: string) => {
    onFilterChange({
      ...filters,
      brand: filters.brand === brand ? '' : brand,
    });
  };

  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    onFilterChange({
      ...filters,
      sortBy,
    });
  };

  return (
    <div className="space-y-4">
      {/* Category Horizontal Scrolling Carousel */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-none border-b border-bazaaro-border/60">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICON_MAP[cat.key] || LayoutGrid;
          const isActive = filters.category === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategorySelect(cat.key)}
              className={`flex items-center gap-2 pb-3 px-1 text-xs sm:text-sm font-semibold shrink-0 transition-colors cursor-pointer border-b-2 ${
                isActive
                  ? 'border-slate-200 text-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-200' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Sub-bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        {/* Left: Brand Pills & Quick Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Brands:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableBrands.slice(0, 7).map((brand) => {
              const isSelected = filters.brand === brand;
              return (
                <button
                  key={brand}
                  onClick={() => handleBrandSelect(brand)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 border-slate-100'
                      : 'bg-transparent text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {brand}
                </button>
              );
            })}
          </div>

          {/* Made in India toggle */}
          <button
            onClick={() => onFilterChange({ ...filters, onlyMadeInIndia: !filters.onlyMadeInIndia })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              filters.onlyMadeInIndia
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : 'bg-transparent border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            <span className="text-[10px]">🇮🇳</span>
            <span>Made in India</span>
            {filters.onlyMadeInIndia && <Check className="w-3 h-3 text-slate-200" />}
          </button>
        </div>

        {/* Right: Results Count & Sort Dropdown */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-500 font-medium">
            <strong className="text-slate-300 font-semibold">{totalResults}</strong> results
          </span>

          <div className="flex items-center gap-1.5">
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
            <select
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value as FilterOptions['sortBy'])}
              className="text-xs font-semibold bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-full px-3 py-1.5 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-hidden cursor-pointer transition-colors"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High (₹)</option>
              <option value="price-desc">Price: High to Low (₹)</option>
              <option value="rating">Highest Rating</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
