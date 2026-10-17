import { NativeModules, Platform } from "react-native";
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from "react-native-purchases";

import { m, type Messages } from "../i18n";
import type { PeriodUnit } from "../i18n/messages/paywall/ru";

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const PRO_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || "pro";

/**
 * True in a development or store build, where App Store / Google Play billing exists.
 * In Expo Go and on the web the SDK runs in "browser mode" and needs a Test Store key.
 */
export const hasNativeStore = Platform.OS !== "web" && Boolean(NativeModules.RNPurchases);

export function getRevenueCatApiKey(): string | null {
  // Each variable is referenced literally so Expo can inline it at build time.
  const key = hasNativeStore
    ? Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  return key?.trim() || null;
}

let configured = false;

/** Configures the SDK once. Returns false when no API key is set for this environment. */
export function configurePurchases(): boolean {
  if (configured) return true;
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) return false;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR).catch(() => undefined);
  Purchases.configure({ apiKey });
  configured = true;
  return true;
}

export const hasProEntitlement = (info: CustomerInfo) =>
  info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;

const asPurchasesError = (error: unknown) =>
  typeof error === "object" && error !== null ? (error as Partial<PurchasesError>) : null;

export function isPurchaseCancelled(error: unknown): boolean {
  const purchasesError = asPurchasesError(error);
  return (
    purchasesError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
    purchasesError?.userCancelled === true
  );
}

export function describePurchaseError(error: unknown): string {
  const errors = m().paywall.errors;
  switch (asPurchasesError(error)?.code) {
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return errors.network;
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      return errors.alreadyPurchased;
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return errors.notAllowed;
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return errors.pending;
    case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      return errors.planUnavailable;
    default:
      return errors.generic;
  }
}

type PlanTitle = keyof Pick<
  Messages["paywall"]["plans"],
  "annual" | "sixMonths" | "threeMonths" | "twoMonths" | "monthly" | "weekly" | "lifetime"
>;

/** The plan names, as keys of `paywall.plans` (read in the current language when shown). */
const PACKAGE_TITLES: Partial<Record<PACKAGE_TYPE, PlanTitle>> = {
  [PACKAGE_TYPE.ANNUAL]: "annual",
  [PACKAGE_TYPE.SIX_MONTH]: "sixMonths",
  [PACKAGE_TYPE.THREE_MONTH]: "threeMonths",
  [PACKAGE_TYPE.TWO_MONTH]: "twoMonths",
  [PACKAGE_TYPE.MONTHLY]: "monthly",
  [PACKAGE_TYPE.WEEKLY]: "weekly",
  [PACKAGE_TYPE.LIFETIME]: "lifetime",
};

const PERIOD_UNITS: readonly PeriodUnit[] = ["DAY", "WEEK", "MONTH", "YEAR"];

const isPeriodUnit = (unit: string): unit is PeriodUnit =>
  (PERIOD_UNITS as readonly string[]).includes(unit);

export interface PlanView {
  id: string;
  title: string;
  price: string;
  /** "≈ $3.33 в месяц" for long plans, "разовая покупка" for lifetime. */
  caption: string | null;
  /** "7 дней бесплатно" when the store offers a free trial. */
  trial: string | null;
  /** Savings vs the monthly plan, in %. */
  savings: number | null;
  isBestValue: boolean;
  pkg: PurchasesPackage;
}

/** Store packages → display models, longest commitment first. */
/**
 * Who may see "N дней бесплатно". Google Play only returns intro offers the user is eligible for,
 * but App Store products always carry their intro price, so on iOS eligibility is checked
 * explicitly. Unknown or failed checks hide the trial rather than promise one.
 */
export async function getTrialEligibility(
  packages: readonly PurchasesPackage[],
): Promise<(productId: string) => boolean> {
  if (Platform.OS !== "ios" || !hasNativeStore || packages.length === 0) return () => true;
  try {
    const result = await Purchases.checkTrialOrIntroductoryPriceEligibility(
      packages.map((pkg) => pkg.product.identifier),
    );
    return (productId) =>
      result[productId]?.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;
  } catch {
    return () => false;
  }
}

export function toPlanViews(
  packages: readonly PurchasesPackage[],
  isTrialEligible: (productId: string) => boolean = () => true,
): PlanView[] {
  const plans = m().paywall.plans;
  const monthly = packages.find((item) => item.packageType === PACKAGE_TYPE.MONTHLY);
  const order = [
    PACKAGE_TYPE.ANNUAL,
    PACKAGE_TYPE.LIFETIME,
    PACKAGE_TYPE.SIX_MONTH,
    PACKAGE_TYPE.THREE_MONTH,
    PACKAGE_TYPE.TWO_MONTH,
    PACKAGE_TYPE.MONTHLY,
    PACKAGE_TYPE.WEEKLY,
  ];
  const rank = (type: PACKAGE_TYPE) => {
    const index = order.indexOf(type);
    return index === -1 ? order.length : index;
  };

  return [...packages]
    .sort((a, b) => rank(a.packageType) - rank(b.packageType))
    .map((pkg) => {
      const { product } = pkg;
      const intro = product.introPrice;
      const trial =
        intro &&
        intro.price === 0 &&
        isPeriodUnit(intro.periodUnit) &&
        isTrialEligible(product.identifier)
          ? plans.trial(intro.periodNumberOfUnits, intro.periodUnit)
          : null;

      let savings: number | null = null;
      if (
        pkg.packageType === PACKAGE_TYPE.ANNUAL &&
        monthly &&
        product.pricePerMonth &&
        monthly.product.price > 0
      ) {
        const percent = Math.round((1 - product.pricePerMonth / monthly.product.price) * 100);
        savings = percent > 0 ? percent : null;
      }

      const caption =
        pkg.packageType === PACKAGE_TYPE.LIFETIME
          ? plans.oneTime
          : pkg.packageType !== PACKAGE_TYPE.MONTHLY &&
              pkg.packageType !== PACKAGE_TYPE.WEEKLY &&
              product.pricePerMonthString
            ? plans.pricePerMonth(product.pricePerMonthString)
            : null;

      const titleKey = PACKAGE_TITLES[pkg.packageType];
      return {
        id: pkg.identifier,
        title: titleKey ? plans[titleKey] : product.title,
        price: product.priceString,
        caption,
        trial,
        savings,
        isBestValue: pkg.packageType === PACKAGE_TYPE.ANNUAL,
        pkg,
      };
    });
}
