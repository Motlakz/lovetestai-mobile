import { Platform } from 'react-native';
import { getItem, setItem } from './storage';

export type SubscriptionPlanId = 'free' | 'generator_unlimited' | 'premium_plus' | 'premium_couples' | 'lifetime';

export type IAPProductId =
  | 'credit_pack_5'
  | 'premium_card_single'
  | 'premium_card_all'
  | 'report_zodiac'
  | 'report_numerology'
  | 'report_soulmate'
  | 'report_attachment'
  | 'test_love_personality'
  | 'bundle_starter'
  | 'bundle_growth'
  | 'bundle_complete'
  | 'prompt_deck';

export interface RCProduct {
  identifier: string;
  title: string;
  description: string;
  price: number;
  priceString: string;
  currencyCode: string;
  productType: 'subscription' | 'consumable' | 'non_consumable';
  subscriptionPeriod?: string;
}

export interface RCOffering {
  identifier: string;
  serverDescription: string;
  availablePackages: RCPackage[];
}

export interface RCPackage {
  identifier: string;
  packageType: string;
  product: RCProduct;
}

export interface RCCustomerInfo {
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  entitlements: {
    active: Record<string, { identifier: string; isActive: boolean; willRenew: boolean; expirationDate: string | null }>;
    all: Record<string, { identifier: string; isActive: boolean }>;
  };
  managementURL: string | null;
}

const SUBSCRIPTION_PRODUCTS: RCProduct[] = [
  {
    identifier: 'lovetestai_unlimited_monthly',
    title: 'Unlimited Monthly',
    description: 'Unlimited AI generations, no watermark',
    price: 3.99,
    priceString: '$3.99',
    currencyCode: 'USD',
    productType: 'subscription',
    subscriptionPeriod: 'P1M',
  },
  {
    identifier: 'lovetestai_plus_monthly',
    title: 'Premium Plus Monthly',
    description: 'Full creative suite with AI Coach',
    price: 8.99,
    priceString: '$8.99',
    currencyCode: 'USD',
    productType: 'subscription',
    subscriptionPeriod: 'P1M',
  },
  {
    identifier: 'lovetestai_couples_monthly',
    title: 'Couples Monthly',
    description: 'Everything for two, Partner Mode included',
    price: 14.99,
    priceString: '$14.99',
    currencyCode: 'USD',
    productType: 'subscription',
    subscriptionPeriod: 'P1M',
  },
  {
    identifier: 'lovetestai_lifetime',
    title: 'Lifetime Access',
    description: 'Pay once, love forever. All features included.',
    price: 79.99,
    priceString: '$79.99',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
];

const IAP_PRODUCTS_LIST: RCProduct[] = [
  {
    identifier: 'lovetestai_credits_5',
    title: '5 AI Credits',
    description: '5 additional AI generation credits',
    price: 0.99,
    priceString: '$0.99',
    currencyCode: 'USD',
    productType: 'consumable',
  },
  {
    identifier: 'lovetestai_card_single',
    title: 'Premium Card Export',
    description: 'Export one creation as a premium card',
    price: 0.50,
    priceString: '$0.50',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
  {
    identifier: 'lovetestai_card_all',
    title: 'All Export Styles',
    description: 'Unlock all export card designs',
    price: 0.99,
    priceString: '$0.99',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
  {
    identifier: 'lovetestai_test_personality',
    title: 'Love Personality Unlock',
    description: 'Full Love Personality Test report',
    price: 3.99,
    priceString: '$3.99',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
  {
    identifier: 'lovetestai_report_zodiac',
    title: 'Zodiac Compatibility Report',
    description: 'Full Zodiac Compatibility PDF',
    price: 4.99,
    priceString: '$4.99',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
  {
    identifier: 'lovetestai_report_numerology',
    title: 'Numerology Life Report',
    description: 'Numerology Love PDF report',
    price: 4.99,
    priceString: '$4.99',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
  {
    identifier: 'lovetestai_report_soulmate',
    title: 'Soulmate Profile',
    description: 'Detailed Soulmate Profile document',
    price: 4.99,
    priceString: '$4.99',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
  {
    identifier: 'lovetestai_report_attachment',
    title: 'Attachment Style Report',
    description: 'Love Personality & Attachment report',
    price: 3.99,
    priceString: '$3.99',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
  {
    identifier: 'lovetestai_prompt_deck',
    title: 'Couples Prompt Deck',
    description: '50 premium conversation prompts',
    price: 4.99,
    priceString: '$4.99',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
  {
    identifier: 'lovetestai_bundle_starter',
    title: 'Starter Bundle',
    description: 'Prompt Deck + Soulmate Kit',
    price: 14.99,
    priceString: '$14.99',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
  {
    identifier: 'lovetestai_bundle_growth',
    title: 'Growth Bundle',
    description: 'Starter + Zodiac + Numerology',
    price: 29.99,
    priceString: '$29.99',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
  {
    identifier: 'lovetestai_bundle_complete',
    title: 'Complete Bundle',
    description: 'All reports & kits included',
    price: 49.99,
    priceString: '$49.99',
    currencyCode: 'USD',
    productType: 'non_consumable',
  },
];

const RC_PRODUCT_TO_PLAN: Record<string, SubscriptionPlanId> = {
  'lovetestai_unlimited_monthly': 'generator_unlimited',
  'lovetestai_plus_monthly': 'premium_plus',
  'lovetestai_couples_monthly': 'premium_couples',
  'lovetestai_lifetime': 'lifetime',
};

const RC_PRODUCT_TO_IAP: Record<string, IAPProductId> = {
  'lovetestai_credits_5': 'credit_pack_5',
  'lovetestai_card_single': 'premium_card_single',
  'lovetestai_card_all': 'premium_card_all',
  'lovetestai_test_personality': 'test_love_personality',
  'lovetestai_report_zodiac': 'report_zodiac',
  'lovetestai_report_numerology': 'report_numerology',
  'lovetestai_report_soulmate': 'report_soulmate',
  'lovetestai_report_attachment': 'report_attachment',
  'lovetestai_prompt_deck': 'prompt_deck',
  'lovetestai_bundle_starter': 'bundle_starter',
  'lovetestai_bundle_growth': 'bundle_growth',
  'lovetestai_bundle_complete': 'bundle_complete',
};

const PLAN_TO_RC_PRODUCT: Record<SubscriptionPlanId, string> = {
  'free': '',
  'generator_unlimited': 'lovetestai_unlimited_monthly',
  'premium_plus': 'lovetestai_plus_monthly',
  'premium_couples': 'lovetestai_couples_monthly',
  'lifetime': 'lovetestai_lifetime',
};

const IAP_TO_RC_PRODUCT: Record<IAPProductId, string> = {
  'credit_pack_5': 'lovetestai_credits_5',
  'premium_card_single': 'lovetestai_card_single',
  'premium_card_all': 'lovetestai_card_all',
  'test_love_personality': 'lovetestai_test_personality',
  'report_zodiac': 'lovetestai_report_zodiac',
  'report_numerology': 'lovetestai_report_numerology',
  'report_soulmate': 'lovetestai_report_soulmate',
  'report_attachment': 'lovetestai_report_attachment',
  'prompt_deck': 'lovetestai_prompt_deck',
  'bundle_starter': 'lovetestai_bundle_starter',
  'bundle_growth': 'lovetestai_bundle_growth',
  'bundle_complete': 'lovetestai_bundle_complete',
};

let _isConfigured = false;

export async function initRevenueCat(_userId?: string): Promise<void> {
  console.log('[RevenueCat] Initializing test store...');
  _isConfigured = true;
  console.log('[RevenueCat] Test store ready. Platform:', Platform.OS);
}

export async function getOfferings(): Promise<{ current: RCOffering | null; all: Record<string, RCOffering> }> {
  console.log('[RevenueCat] Fetching offerings...');

  const subscriptionPackages: RCPackage[] = SUBSCRIPTION_PRODUCTS.map(product => ({
    identifier: product.identifier,
    packageType: product.productType === 'subscription' ? 'MONTHLY' : 'LIFETIME',
    product,
  }));

  const iapPackages: RCPackage[] = IAP_PRODUCTS_LIST.map(product => ({
    identifier: product.identifier,
    packageType: 'CUSTOM',
    product,
  }));

  const subscriptionsOffering: RCOffering = {
    identifier: 'default',
    serverDescription: 'Love Test AI Subscriptions',
    availablePackages: subscriptionPackages,
  };

  const addonsOffering: RCOffering = {
    identifier: 'addons',
    serverDescription: 'Love Test AI Add-ons & Reports',
    availablePackages: iapPackages,
  };

  return {
    current: subscriptionsOffering,
    all: {
      default: subscriptionsOffering,
      addons: addonsOffering,
    },
  };
}

export async function getCustomerInfo(): Promise<RCCustomerInfo> {
  console.log('[RevenueCat] Fetching customer info...');

  const storedPlan = await getItem<SubscriptionPlanId>('subscription_plan');
  const storedIAPs = await getItem<IAPProductId[]>('purchased_iaps') ?? [];

  const activeSubscriptions: string[] = [];
  const allPurchased: string[] = [];
  const activeEntitlements: Record<string, { identifier: string; isActive: boolean; willRenew: boolean; expirationDate: string | null }> = {};

  if (storedPlan && storedPlan !== 'free') {
    const rcProductId = PLAN_TO_RC_PRODUCT[storedPlan];
    if (rcProductId) {
      activeSubscriptions.push(rcProductId);
      allPurchased.push(rcProductId);

      activeEntitlements[storedPlan] = {
        identifier: storedPlan,
        isActive: true,
        willRenew: storedPlan !== 'lifetime',
        expirationDate: storedPlan === 'lifetime' ? null : new Date(Date.now() + 30 * 86400000).toISOString(),
      };

      if (storedPlan === 'lifetime' || storedPlan === 'premium_couples') {
        activeEntitlements['premium_plus'] = { identifier: 'premium_plus', isActive: true, willRenew: false, expirationDate: null };
        activeEntitlements['generator_unlimited'] = { identifier: 'generator_unlimited', isActive: true, willRenew: false, expirationDate: null };
      } else if (storedPlan === 'premium_plus') {
        activeEntitlements['generator_unlimited'] = { identifier: 'generator_unlimited', isActive: true, willRenew: false, expirationDate: null };
      }
    }
  }

  storedIAPs.forEach(iapId => {
    const rcProductId = IAP_TO_RC_PRODUCT[iapId];
    if (rcProductId) {
      allPurchased.push(rcProductId);
      activeEntitlements[iapId] = { identifier: iapId, isActive: true, willRenew: false, expirationDate: null };
    }
  });

  return {
    activeSubscriptions,
    allPurchasedProductIdentifiers: allPurchased,
    entitlements: {
      active: activeEntitlements,
      all: activeEntitlements,
    },
    managementURL: Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions',
  };
}

export async function purchaseSubscription(planId: SubscriptionPlanId): Promise<{ success: boolean; customerInfo: RCCustomerInfo }> {
  console.log('[RevenueCat] Processing subscription purchase:', planId);

  await setItem('subscription_plan', planId);

  const customerInfo = await getCustomerInfo();
  console.log('[RevenueCat] Subscription activated:', planId);

  return { success: true, customerInfo };
}

export async function purchaseProduct(iapId: IAPProductId): Promise<{ success: boolean; customerInfo: RCCustomerInfo }> {
  console.log('[RevenueCat] Processing IAP purchase:', iapId);

  const existing = await getItem<IAPProductId[]>('purchased_iaps') ?? [];

  if (iapId === 'credit_pack_5') {
    const currentBonus = await getItem<number>('bonus_credits') ?? 0;
    await setItem('bonus_credits', currentBonus + 5);
    console.log('[RevenueCat] Credits added. New bonus total:', currentBonus + 5);
  }

  if (!existing.includes(iapId) || iapId === 'credit_pack_5') {
    const updated = iapId === 'credit_pack_5' ? existing : [...existing, iapId];
    await setItem('purchased_iaps', updated);
  }

  const customerInfo = await getCustomerInfo();
  return { success: true, customerInfo };
}

export async function restorePurchases(): Promise<RCCustomerInfo> {
  console.log('[RevenueCat] Restoring purchases...');
  const customerInfo = await getCustomerInfo();
  console.log('[RevenueCat] Restore complete. Active entitlements:', Object.keys(customerInfo.entitlements.active));
  return customerInfo;
}

export async function cancelSubscription(): Promise<{ success: boolean }> {
  console.log('[RevenueCat] Cancelling subscription...');
  await setItem('subscription_plan', 'free');
  return { success: true };
}

export function getProductForPlan(planId: SubscriptionPlanId): RCProduct | undefined {
  const rcId = PLAN_TO_RC_PRODUCT[planId];
  return SUBSCRIPTION_PRODUCTS.find(p => p.identifier === rcId);
}

export function getProductForIAP(iapId: IAPProductId): RCProduct | undefined {
  const rcId = IAP_TO_RC_PRODUCT[iapId];
  return IAP_PRODUCTS_LIST.find(p => p.identifier === rcId);
}

export function getAllSubscriptionProducts(): RCProduct[] {
  return [...SUBSCRIPTION_PRODUCTS];
}

export function getAllIAPProducts(): RCProduct[] {
  return [...IAP_PRODUCTS_LIST];
}

export { RC_PRODUCT_TO_PLAN, RC_PRODUCT_TO_IAP, PLAN_TO_RC_PRODUCT, IAP_TO_RC_PRODUCT };
