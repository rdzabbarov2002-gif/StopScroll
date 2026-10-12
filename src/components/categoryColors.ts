import type { ThemeColors } from "../utils/theme";
import type { ReplacementCategory } from "../utils/types";

/** iOS-style icon tile color per replacement category. */
export function categoryColor(category: ReplacementCategory, colors: ThemeColors): string {
  return { body: colors.warning, mind: colors.primary, facts: colors.indigo }[category];
}
