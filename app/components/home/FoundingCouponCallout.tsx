import {
  FOUNDING_COUPON_CODE,
  FOUNDING_MEMBERS_CAP,
  LICENSE_VERIFICATION_FEE_USD,
} from "@/lib/founding-promo";
import { cn } from "@/lib/utils";

type FoundingCouponCalloutProps = {
  className?: string;
};

/**
 * Figma: Movyn — founding coupon (node 54:248). Grey bar + blue code chip; disclaimer below.
 */
export function FoundingCouponCallout({ className }: FoundingCouponCalloutProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div className="flex w-full flex-wrap items-center justify-center gap-[4px] overflow-hidden rounded-[8px] border border-[#e5e5e5] bg-[#f5f5f5] p-[9px] dark:border-neutral-700 dark:bg-neutral-900">
        <div className="shrink-0 pr-2">
          <div className="flex items-center justify-center overflow-hidden rounded-[8px] bg-[#2563eb] px-2 pb-[3px] pt-1 dark:bg-blue-600">
            <span className="text-center text-xs font-medium leading-4 text-[#fafafa]">
              {FOUNDING_COUPON_CODE}
            </span>
          </div>
        </div>
        <p className="text-center text-sm font-medium leading-5 text-[#0a0a0a] dark:text-neutral-100">
          Use coupon code {FOUNDING_COUPON_CODE} at sign-up for free license verification.
        </p>
      </div>
      <p className="w-full text-center text-xs font-medium leading-4 text-black dark:text-neutral-300">
        Limited to the first founding {FOUNDING_MEMBERS_CAP} chiropractors. After the first{" "}
        {FOUNDING_MEMBERS_CAP} spots are gone,
        <br aria-hidden="true" />
        a one-time ${LICENSE_VERIFICATION_FEE_USD}{" "}
        verification fee applies to any plan.
      </p>
    </div>
  );
}
