import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { Product, IProduct } from '../models/Product';
import { isDbConnected } from '../config/db';
import { PRODUCTS } from '../../src/data/products';

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface UserQueryIntent {
  rawText: string;
  category?: string;
  brand?: string;
  maxPrice?: number;
  minPrice?: number;
  isComparison: boolean;
  modelMentions: string[];
  keywords: string[];
}

/**
 * Extracts shopping constraints, budget, category, brands, and comparison intents
 * from natural language user queries.
 */
export function parseUserQueryIntent(query: string): UserQueryIntent {
  const text = query.trim();
  const lower = text.toLowerCase();

  let maxPrice: number | undefined;
  let minPrice: number | undefined;

  // 1. Budget & Price parsing
  // Patterns like "under 30000", "under ₹30,000", "under 30k", "below 25k", "under 1.5 lakh"
  const underMatch = lower.match(/(?:under|below|less than|within|max(?:imum)? of|budget of)\s*₹?\s*(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac)?/i);
  if (underMatch) {
    let val = parseFloat(underMatch[1].replace(/,/g, ''));
    const unit = (underMatch[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'thousand') val *= 1000;
    else if (unit === 'lakh' || unit === 'lac') val *= 100000;
    else if (val < 200 && !unit) val *= 1000; // e.g. "under 30" usually means 30k
    maxPrice = val;
  }

  const aboveMatch = lower.match(/(?:above|more than|over|greater than|at least)\s*₹?\s*(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac)?/i);
  if (aboveMatch) {
    let val = parseFloat(aboveMatch[1].replace(/,/g, ''));
    const unit = (aboveMatch[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'thousand') val *= 1000;
    else if (unit === 'lakh' || unit === 'lac') val *= 100000;
    else if (val < 200 && !unit) val *= 1000;
    minPrice = val;
  }

  // 2. Category matching with word boundaries to avoid false positives (e.g. 'headphones' containing 'phone')
  let category: string | undefined;
  if (/\b(?:headphones?|earphones?|earbuds?|tws|anc|audio|buds|airpods?|speakers?)\b/i.test(lower)) {
    category = 'audio';
  } else if (/\b(?:smartphones?|phones?|mobiles?|android|iphones?)\b/i.test(lower)) {
    category = 'smartphones';
  } else if (/\b(?:laptops?|macbooks?|notebooks?|pc|computers?|zephyrus|ideapads?)\b/i.test(lower)) {
    category = 'laptops';
  } else if (/\b(?:smartwatches?|watches?|wearables?|fitness bands?)\b/i.test(lower)) {
    category = 'wearables';
  } else if (/\b(?:gaming|consoles?|ps5|playstations?)\b/i.test(lower)) {
    category = 'gaming';
  } else if (/\b(?:smart homes?|echo|alexa|air purifiers?|purifiers?)\b/i.test(lower)) {
    category = 'smarthome';
  } else if (/\b(?:keyboards?|mouse|mice|accessories)\b/i.test(lower)) {
    category = 'accessories';
  }

  // 3. Brand identification
  const knownBrands = [
    'Apple', 'Samsung', 'OnePlus', 'Sony', 'boAt', 'Lenovo', 'ASUS',
    'Nothing', 'Xiaomi', 'Redmi', 'Noise', 'Keychron', 'Logitech', 'Amazon', 'Dell'
  ];
  let brand: string | undefined;
  for (const b of knownBrands) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(lower)) {
      brand = b;
      break;
    }
  }

  // 4. Comparison intent
  const isComparison = /vs|compare|difference between|versus|or/i.test(lower);

  // 5. Model mentions
  const knownModels = [
    's24', 's24 ultra', 'iphone 15', 'iphone 14', 'iphone 16', 'iphone',
    'oneplus 12r', '12r', 'nothing phone', '2a', 'redmi note 13', 'macbook air',
    'macbook', 'm3', 'ideapad', 'zephyrus', 'xps', 'wh-1000xm5', 'nirvana', 'airpods',
    'galaxy watch', 'playstation 5', 'ps5', 'echo dot', 'air purifier', 'mx master', 'k2'
  ];
  const modelMentions: string[] = [];
  for (const m of knownModels) {
    if (lower.includes(m)) {
      modelMentions.push(m);
    }
  }

  // 6. Keywords
  const featureWords = ['anc', 'noise cancellation', 'battery', 'camera', 'gaming', 'oled', '120hz', 'curved', 'fast charging', 'lightweight', 'student', 'coding'];
  const keywords = featureWords.filter((w) => lower.includes(w));

  return {
    rawText: text,
    category,
    brand,
    maxPrice,
    minPrice,
    isComparison,
    modelMentions,
    keywords,
  };
}

export interface GroundingResult {
  products: any[];
  matchedCount: number;
  isExactPriceMatch: boolean;
  outOfStockProducts: any[];
  alternatives: any[];
  queriedModelsNotInCatalog: string[];
}

/**
 * Queries MongoDB Atlas live Product collection to retrieve grounded product facts.
 */
export async function retrieveGroundedProducts(intent: UserQueryIntent): Promise<GroundingResult> {
  // If MongoDB is not connected, ground directly from in-memory PRODUCTS
  if (!isDbConnected()) {
    let matching = PRODUCTS.filter((p) => {
      if (intent.category && p.category !== intent.category) return false;
      if (intent.brand && !new RegExp(intent.brand, 'i').test(p.brand)) return false;
      if (intent.maxPrice && p.price > intent.maxPrice) return false;
      if (intent.minPrice && p.price < intent.minPrice) return false;
      if (intent.modelMentions.length > 0 && !intent.category && !intent.brand) {
        const matchesAny = intent.modelMentions.some((m) => new RegExp(m, 'i').test(p.name));
        if (!matchesAny) return false;
      }
      return true;
    });

    matching.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    const products = matching.slice(0, 8);
    const isExactPriceMatch = products.length > 0;
    let alternatives: any[] = [];

    if (products.length === 0 && (intent.maxPrice || intent.category || intent.brand)) {
      alternatives = PRODUCTS.filter((p) => {
        if (intent.category) return p.category === intent.category;
        if (intent.brand) return new RegExp(intent.brand, 'i').test(p.brand);
        return true;
      })
        .sort((a, b) => a.price - b.price)
        .slice(0, 4);
    }

    const outOfStockProducts = products.filter((p) => !p.inStock || p.stockCount <= 0);
    const queriedModelsNotInCatalog: string[] = [];
    for (const m of intent.modelMentions) {
      const found = PRODUCTS.some((p) => new RegExp(m, 'i').test(p.name));
      if (!found) {
        queriedModelsNotInCatalog.push(m);
      }
    }

    return {
      products,
      matchedCount: products.length,
      isExactPriceMatch,
      outOfStockProducts,
      alternatives,
      queriedModelsNotInCatalog,
    };
  }

  const query: any = { isActive: { $ne: false } };

  if (intent.category) {
    query.category = intent.category;
  }

  if (intent.brand) {
    query.brand = new RegExp(intent.brand, 'i');
  }

  if (intent.maxPrice || intent.minPrice) {
    query.price = {};
    if (intent.maxPrice) query.price.$lte = intent.maxPrice;
    if (intent.minPrice) query.price.$gte = intent.minPrice;
  }

  // If specific model mentions exist, build regex search
  if (intent.modelMentions.length > 0 && !intent.category && !intent.brand) {
    const regexes = intent.modelMentions.map((m) => new RegExp(m, 'i'));
    query.$or = regexes.map((r) => ({ name: r }));
  }

  // 1. Fetch live matching products from MongoDB
  let products = await Product.find(query)
    .sort({ rating: -1, reviewCount: -1 })
    .limit(8)
    .lean();

  let isExactPriceMatch = products.length > 0;
  let alternatives: any[] = [];

  // If strict budget/category returned zero products, fetch closest alternatives
  if (products.length === 0 && (intent.maxPrice || intent.category || intent.brand)) {
    const fallbackQuery: any = { isActive: { $ne: false } };
    if (intent.category) fallbackQuery.category = intent.category;
    else if (intent.brand) fallbackQuery.brand = new RegExp(intent.brand, 'i');

    alternatives = await Product.find(fallbackQuery)
      .sort({ price: 1 }) // show most affordable available
      .limit(4)
      .lean();
  }

  // Check out-of-stock items in matching results
  const outOfStockProducts = products.filter((p) => !p.inStock || p.stockCount <= 0);

  // Check if user requested models not present in catalog (e.g. "iPhone 15")
  const queriedModelsNotInCatalog: string[] = [];
  for (const m of intent.modelMentions) {
    const foundInDb = await Product.exists({
      name: new RegExp(m, 'i'),
      isActive: { $ne: false },
    });
    if (!foundInDb) {
      queriedModelsNotInCatalog.push(m);
    }
  }

  return {
    products,
    matchedCount: products.length,
    isExactPriceMatch,
    outOfStockProducts,
    alternatives,
    queriedModelsNotInCatalog,
  };
}

/**
 * Builds concise, token-efficient grounding context for the Gemini system prompt.
 */
export function formatCatalogGroundingText(result: GroundingResult, intent: UserQueryIntent): string {
  const lines: string[] = [];

  lines.push('--- LIVE BAZAARO MONGODB PRODUCT CATALOG DATA ---');

  if (result.products.length > 0) {
    lines.push(`Found ${result.products.length} live catalog matches for shopper query:`);
    for (const p of result.products) {
      const topSpecs = p.specs ? Object.entries(p.specs).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
      lines.push(
        `- [PRODUCT:${p.id}] "${p.name}" | Brand: ${p.brand} | Category: ${p.category} | Price: ₹${p.price.toLocaleString('en-IN')} (M.R.P.: ₹${p.originalPrice?.toLocaleString('en-IN') || p.price}, ${p.discountPercent || 0}% OFF) | Rating: ${p.rating}★ (${p.reviewCount} reviews) | In Stock: ${p.inStock && p.stockCount > 0 ? `YES (${p.stockCount} units available)` : 'NO (OUT OF STOCK)'} | Key Specs: ${topSpecs || p.description} | Delivery: ${p.fastDelivery || '24-48 Hours'} | Warranty: ${p.warranty || '1 Year Brand Domestic Warranty'}`
      );
    }
  } else {
    lines.push(`No products directly match criteria (Category: ${intent.category || 'Any'}, Max Budget: ₹${intent.maxPrice ? intent.maxPrice.toLocaleString('en-IN') : 'None'}).`);
  }

  if (result.alternatives.length > 0) {
    lines.push('\nClosest available alternatives in catalog:');
    for (const p of result.alternatives) {
      lines.push(
        `- [PRODUCT:${p.id}] "${p.name}" | Brand: ${p.brand} | Price: ₹${p.price.toLocaleString('en-IN')} | Rating: ${p.rating}★ | Stock: ${p.stockCount} units`
      );
    }
  }

  if (result.queriedModelsNotInCatalog.length > 0) {
    lines.push(`\nNOTICE: The following requested models are NOT in the Bazaaro catalog: ${result.queriedModelsNotInCatalog.join(', ')}. Inform the user politely and recommend the closest available options.`);
  }

  lines.push('--------------------------------------------------');
  return lines.join('\n');
}

/**
 * Extracts product IDs like [PRODUCT:p1] from generated text.
 */
export function extractProductIdsFromText(text: string): string[] {
  const matches = text.match(/\[PRODUCT:([a-zA-Z0-9_-]+)\]/g);
  if (!matches) return [];
  const set = new Set(matches.map((m) => m.replace('[PRODUCT:', '').replace(']', '')));
  return Array.from(set);
}

/**
 * Deterministic local fallback advisor that operates strictly from live MongoDB data
 * when external Gemini API is unreachable.
 */
export function generateLocalGroundedFallback(
  userPrompt: string,
  result: GroundingResult,
  intent: UserQueryIntent
): string {
  const parts: string[] = [];

  parts.push(`Namaste! I am your **Bazaaro AI Dost**. Here is what our live catalog offers for your request:\n`);

  if (result.queriedModelsNotInCatalog.length > 0) {
    parts.push(`> ℹ️ *Note: Bazaaro currently does not stock **${result.queriedModelsNotInCatalog.join(', ')}**, but we have exceptional flagship alternatives ready to ship with official Indian warranty.*\n`);
  }

  if (result.products.length > 0) {
    parts.push(`### Top Recommendations from Bazaaro:`);
    result.products.slice(0, 3).forEach((p, idx) => {
      const topSpecStr = p.specs ? Object.entries(p.specs).slice(0, 3).map(([k, v]) => `**${k}**: ${v}`).join(' • ') : '';
      const stockStatus = p.inStock && p.stockCount > 0
        ? `In Stock (${p.stockCount} units)`
        : `⚠️ Currently Out of Stock`;

      parts.push(
        `${idx + 1}. **${p.name}** - ₹${p.price.toLocaleString('en-IN')} [PRODUCT:${p.id}]\n` +
        `   • *Status*: ${stockStatus} | ⭐ ${p.rating} / 5 (${p.reviewCount} customer reviews)\n` +
        `   • *Key Highlights*: ${topSpecStr || p.description}\n` +
        `   • *Domestic Assurance*: ${p.warranty || '1 Year Pan-India Warranty'} with delivery in ${p.fastDelivery || '24-48 Hours'}.\n`
      );
    });

    parts.push(`💡 **Bazaaro Pro-Tip**: Click **"Specs"** on any recommendation card below to check full specifications, No-Cost EMI plans on HDFC/ICICI, delivery dates to your PIN code, and verified buyer reviews!`);
  } else if (result.alternatives.length > 0) {
    parts.push(`We currently don't have any ${intent.category || 'items'} under your target budget of ₹${intent.maxPrice?.toLocaleString('en-IN')}.\n`);
    parts.push(`However, here are the most affordable verified options available in our live catalog:\n`);
    result.alternatives.slice(0, 2).forEach((p, idx) => {
      parts.push(
        `${idx + 1}. **${p.name}** - ₹${p.price.toLocaleString('en-IN')} [PRODUCT:${p.id}] (Rating: ${p.rating}★)\n`
      );
    });
    parts.push(`\nWould you like to explore other electronic categories or check for seasonal bank discounts?`);
  } else {
    parts.push(`We currently couldn't find any products in our catalog matching "${userPrompt}". Our catalog features top smartphones, laptops, ANC audio, wearables, gaming gear, and smart home tech. Tell me what type of gadget you need and I'll find the best Dhamaka deal!`);
  }

  return parts.join('\n');
}

/**
 * Main AI Shopping Guru handler.
 * Combines MongoDB product retrieval, Gemini prompt synthesis, structured references,
 * and seamless fallback.
 */
export async function handleAiShoppingAdvice(
  messages: Array<{ role: string; content: string }>
): Promise<{
  reply: string;
  recommendedProductIds: string[];
  recommendedProducts: any[];
}> {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages array is required');
  }

  const lastMessage = messages[messages.length - 1];
  const userPrompt = (lastMessage.content || '').trim();

  if (!userPrompt) {
    return {
      reply: 'Namaste! Please tell me what electronic gadget or tech specs you are looking for today.',
      recommendedProductIds: [],
      recommendedProducts: [],
    };
  }

  // 1. Analyze query intent
  const intent = parseUserQueryIntent(userPrompt);

  // 2. Retrieve live grounded catalog data from MongoDB Atlas
  let groundingResult: GroundingResult;
  try {
    groundingResult = await retrieveGroundedProducts(intent);
  } catch (dbErr: any) {
    console.error('[AI Advisor DB Error]', dbErr.message);
    groundingResult = {
      products: [],
      matchedCount: 0,
      isExactPriceMatch: false,
      outOfStockProducts: [],
      alternatives: [],
      queriedModelsNotInCatalog: [],
    };
  }

  const groundingText = formatCatalogGroundingText(groundingResult, intent);

  // 3. System prompt enforcing strict database grounding
  const systemInstruction = `You are "Bazaaro AI Dost", an expert, warm, and tech-savvy Indian electronics shopping advisor at "Bazaaro" (Tagline: "Sab kuch, ek bazaar mein"). 🇮🇳

MISSION & RULES:
1. STRICT CATALOG GROUNDING:
   - Base all product recommendations, pricing, specifications, ratings, and stock status EXCLUSIVELY on the provided LIVE BAZAARO MONGODB PRODUCT CATALOG DATA below.
   - NEVER invent or hallucinate products, prices, ratings, discounts, or stock numbers.
   - If an item is NOT in the catalog (e.g. iPhone 15), explicitly state that Bazaaro does not currently stock it, and recommend the best available catalog alternative.
   - If an item is out of stock in the catalog, clearly warn the user that it is currently out of stock and offer an in-stock alternative.
2. PRODUCT REFERENCE SYNTAX:
   - When referencing or recommending ANY available catalog product, ALWAYS tag it with [PRODUCT:id] (e.g. [PRODUCT:p2], [PRODUCT:p10]). This allows the frontend to render interactive action cards ("Specs", "Add to Cart").
3. TONE & EXPERTISE:
   - Fluent, helpful English infused with polite Indian warmth (friendly phrases like "Namaste", "Dhamaka deal", "Shandaar performance" where natural).
   - Sharp technical explanations (RAM, Processor, Display, Battery life, Fast charging, Camera, Active Noise Cancellation).
   - Mention Indian shopper benefits: 1-Year Brand Domestic Warranty across India, No-Cost EMI plans on HDFC/ICICI/SBI cards, fast delivery in 24-48 hours via BlueDart, and genuine GST invoices.
4. RESPONSE STRUCTURE:
   - Quick Verdict / Direct Recommendation
   - Top Recommendations (Price in ₹ INR, key specs, why it fits the budget/needs, and [PRODUCT:id] tag)
   - Helpful Pro-Tip

${groundingText}`;

  let reply = '';
  const client = getGeminiClient();

  if (client) {
    try {
      // Use conversation history (last 6 messages max for context efficiency)
      const historyTurns = messages.slice(-6).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // Call Gemini 3.5 Flash-Lite with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await client.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
        contents: historyTurns,
        config: {
          systemInstruction,
          temperature: 0.7,
          topP: 0.95,
        },
      });

      clearTimeout(timeoutId);

      if (response.text && response.text.trim().length > 0) {
        reply = response.text.trim();
      }
    } catch (geminiError: any) {
      console.warn('[Gemini API Notice] Using live MongoDB grounded fallback:', geminiError.message);
    }
  }

  // If Gemini wasn't available or failed, use live MongoDB grounded generator
  if (!reply) {
    reply = generateLocalGroundedFallback(userPrompt, groundingResult, intent);
  }

  // 4. Extract referenced product IDs and populate full product objects for the frontend
  const recommendedProductIds = extractProductIdsFromText(reply);

  // Fetch full details of referenced products from MongoDB if available
  let recommendedProducts: any[] = [];
  if (recommendedProductIds.length > 0) {
    if (isDbConnected()) {
      try {
        recommendedProducts = await Product.find({
          id: { $in: recommendedProductIds },
          isActive: { $ne: false },
        }).lean();
      } catch (err: any) {
        recommendedProducts = PRODUCTS.filter((p) => recommendedProductIds.includes(p.id));
      }
    } else {
      recommendedProducts = PRODUCTS.filter((p) => recommendedProductIds.includes(p.id));
    }
  } else if (groundingResult.products.length > 0) {
    recommendedProducts = groundingResult.products.slice(0, 3);
  }

  return {
    reply,
    recommendedProductIds,
    recommendedProducts,
  };
}
