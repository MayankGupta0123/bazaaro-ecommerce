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
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICON_MAP[cat.key] || LayoutGrid;
          const isActive = filters.category === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategorySelect(cat.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-102 ring-2 ring-amber-500/50'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-xs'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Sub-bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand Pills & Quick Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Brands:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {availableBrands.slice(0, 7).map((brand) => {
              const isSelected = filters.brand === brand;
              return (
                <button
                  key={brand}
                  onClick={() => handleBrandSelect(brand)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
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
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              filters.onlyMadeInIndia
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="text-[10px]">🇮🇳</span>
            <span>Made in India</span>
            {filters.onlyMadeInIndia && <Check className="w-3 h-3 text-emerald-600" />}
          </button>
        </div>

        {/* Right: Results Count & Sort Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{totalResults}</strong> items
          </span>

          <div className="flex items-center gap-1.5">
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <select
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value as FilterOptions['sortBy'])}
              className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-amber-500 outline-hidden cursor-pointer"
            >
              <option value="featured">Sort: Featured Indian Picks</option>
              <option value="price-asc">Price: Low to High (₹)</option>
              <option value="price-desc">Price: High to Low (₹)</option>
              <option value="rating">Highest Customer Rating</option>
              <option value="discount">Biggest Discount (%)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
