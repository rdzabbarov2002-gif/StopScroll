import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Purchases, { type CustomerInfo, type PurchasesPackage } from "react-native-purchases";

import { m } from "../i18n";
import {
  configurePurchases,
  describePurchaseError,
  getTrialEligibility,
  hasProEntitlement,
  isPurchaseCancelled,
  toPlanViews,
  type PlanView,
} from "../services/purchases";
import { DEMO_MODE } from "../utils/demo";

/** The test Pro switch exists in dev builds and in the web preview, never in store builds. */
const TEST_PRO_ALLOWED = __DEV__ || DEMO_MODE;

/**
 * loading — the SDK is starting; ready — RevenueCat is configured;
 * unavailable — no API key for this environment (purchases are switched off).
 */
export type ProStatus = "loading" | "ready" | "unavailable";

export type PurchaseResult = { ok: true } | { ok: false; cancelled: boolean; message: string };

export interface ProContextValue {
  isPro: boolean;
  status: ProStatus;
  plans: PlanView[];
  plansLoading: boolean;
  plansError: string | null;
  loadPlans: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<PurchaseResult>;
  /** Resolves to true when an active Pro entitlement was found. */
  restore: () => Promise<PurchaseResult & { restored?: boolean }>;
  /** Development builds only: unlocks Pro locally to test gated features. */
  devPro: boolean;
  setDevPro: (value: boolean) => void;
}

const ProContext = createContext<ProContextValue | null>(null);

function tryConfigure(): boolean {
  try {
    return configurePurchases();
  } catch (error) {
    console.warn("StopScroll: RevenueCat could not be configured", error);
    return false;
  }
}

export function ProProvider({ children }: { children: ReactNode }) {
  // Configured once, synchronously, so the first render already knows if purchases exist.
  const [configured] = useState(tryConfigure);
  const [status, setStatus] = useState<ProStatus>(configured ? "loading" : "unavailable");
  const [storePro, setStorePro] = useState(false);
  const [devPro, setDevProState] = useState(false);
  const [plans, setPlans] = useState<PlanView[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;

    let active = true;
    const onUpdate = (info: CustomerInfo) => {
      if (active) setStorePro(hasProEntitlement(info));
    };
    Purchases.addCustomerInfoUpdateListener(onUpdate);
    Purchases.getCustomerInfo()
      .then(onUpdate)
      .catch((error: unknown) => console.warn("StopScroll: could not read customer info", error))
      .finally(() => {
        if (active) setStatus("ready");
      });

    return () => {
      active = false;
      Purchases.removeCustomerInfoUpdateListener(onUpdate);
    };
  }, [configured]);

  const loadPlans = useCallback(async () => {
    if (status !== "ready") return;
    setPlansLoading(true);
    setPlansError(null);
    try {
      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages ?? [];
      const isTrialEligible = await getTrialEligibility(packages);
      setPlans(toPlanViews(packages, isTrialEligible));
      if (packages.length === 0) {
        setPlansError(m().paywall.errors.noPlans);
      }
    } catch (error) {
      setPlansError(describePurchaseError(error));
    } finally {
      setPlansLoading(false);
    }
  }, [status]);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const unlocked = hasProEntitlement(customerInfo);
      setStorePro(unlocked);
      return unlocked
        ? { ok: true }
        : {
            ok: false,
            cancelled: false,
            message: m().paywall.errors.notActivated,
          };
    } catch (error) {
      const cancelled = isPurchaseCancelled(error);
      return { ok: false, cancelled, message: cancelled ? "" : describePurchaseError(error) };
    }
  }, []);

  const restore = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      const restored = hasProEntitlement(info);
      setStorePro(restored);
      return { ok: true as const, restored };
    } catch (error) {
      return { ok: false as const, cancelled: false, message: describePurchaseError(error) };
    }
  }, []);

  const setDevPro = useCallback((value: boolean) => {
    if (TEST_PRO_ALLOWED) setDevProState(value);
  }, []);

  const value = useMemo<ProContextValue>(
    () => ({
      isPro: storePro || (TEST_PRO_ALLOWED && devPro),
      status,
      plans,
      plansLoading,
      plansError,
      loadPlans,
      purchase,
      restore,
      devPro,
      setDevPro,
    }),
    [
      storePro,
      devPro,
      status,
      plans,
      plansLoading,
      plansError,
      loadPlans,
      purchase,
      restore,
      setDevPro,
    ],
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro(): ProContextValue {
  const context = useContext(ProContext);
  if (!context) throw new Error("usePro must be used inside <ProProvider>");
  return context;
}
