// Mirrors apps/storefront-widget/src/widget.ts's own product image + rating
// fetch logic, so the conversation transcript in the dashboard can render
// product cards that look exactly like what the customer actually saw.
const REVIEWS_SHOP_DOMAIN = "muditam.myshopify.com";
const REVIEWS_PUBLIC_TOKEN = "iTi8cj-8vCPFfNyZt5UrVeQzbMM";

// Used only when Judge.me's live API has zero real reviews for a product —
// same values the storefront's own product pages display. Kept in sync with
// the FALLBACK_RATINGS map in apps/storefront-widget/src/widget.ts.
const FALLBACK_RATINGS = {
  "sugar-defend-pro": { average: 4.8, count: 2000 },
  "karela-jamun-fizz": { average: 4.8, count: 5000 },
  "berberine-pro": { average: 4.8, count: 800 },
  "heart-defend-pro": { average: 4.8, count: 600 },
  "liver-defend-pro": { average: 4.8, count: 600 },
  "liver-fix": { average: 4.8, count: 3500 },
  "bone-dense": { average: 4.8, count: 900 },
  "core-essentials": { average: 4.8, count: 900 },
  "shilajit-with-gold": { average: 4.8, count: 1500 },
};

const productCache = new Map();

async function fetchShopifyProduct(productUrl) {
  if (productCache.has(productUrl)) return productCache.get(productUrl);
  const request = (async () => {
    try {
      const url = new URL(productUrl);
      url.pathname = `${url.pathname.replace(/\/$/, "")}.js`;
      url.search = "";
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  })();
  productCache.set(productUrl, request);
  return request;
}

function imageFromShopifyProduct(product, productUrl) {
  if (!product) return null;
  const featured = typeof product.featured_image === "string" ? product.featured_image : product.featured_image?.src;
  const firstImage = product.images?.map((image) => (typeof image === "string" ? image : image.src)).find(Boolean);
  const source = featured || firstImage;
  return source ? new URL(source, new URL(productUrl).origin).href : null;
}

async function fetchJudgeMeRating(productExternalId) {
  try {
    const url = new URL("https://judge.me/api/v1/widgets/product_review");
    url.searchParams.set("shop_domain", REVIEWS_SHOP_DOMAIN);
    url.searchParams.set("api_token", REVIEWS_PUBLIC_TOKEN);
    url.searchParams.set("external_id", String(productExternalId));
    url.searchParams.set("platform", "shopify");
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data = await response.json();
    const average = data.widget?.match(/data-average-rating=['"]([^'"]+)['"]/)?.[1];
    const count = data.widget?.match(/data-number-of-reviews=['"]([^'"]+)['"]/)?.[1];
    const averageNumber = average ? Number.parseFloat(average) : NaN;
    const countNumber = count ? Number.parseInt(count, 10) : NaN;
    if (!Number.isFinite(averageNumber) || !Number.isFinite(countNumber) || countNumber <= 0) return null;
    return { average: averageNumber, count: countNumber };
  } catch {
    return null;
  }
}

export function renderStars(average) {
  const rounded = Math.round(average * 2) / 2;
  return Array.from({ length: 5 }, (_, index) => {
    const position = index + 1;
    if (rounded >= position) return "★";
    if (rounded + 0.5 === position) return "⯨";
    return "☆";
  }).join("");
}

export async function loadProductDisplayData(productSlug, productUrl) {
  const shopifyProduct = await fetchShopifyProduct(productUrl);
  const image = imageFromShopifyProduct(shopifyProduct, productUrl);
  const liveRating = shopifyProduct ? await fetchJudgeMeRating(shopifyProduct.id) : null;
  const rating = liveRating ?? FALLBACK_RATINGS[productSlug] ?? null;
  return { image, rating };
}
