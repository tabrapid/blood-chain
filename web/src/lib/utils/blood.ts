import type { BloodComponent, BloodGroup, RhFactor } from "@prisma/client";

export function rhToUi(rh: RhFactor | null | undefined) {
  if (rh === "plus") return "+";
  if (rh === "minus") return "-";
  return null;
}

export function rhFromUi(rh: string | null | undefined): RhFactor | null {
  if (rh === "+") return "plus";
  if (rh === "-") return "minus";
  return null;
}

export function bloodGroupToUi(bg: BloodGroup | null | undefined) {
  return bg ?? null;
}

export function componentFromUi(c: string): BloodComponent {
  return c as BloodComponent;
}

