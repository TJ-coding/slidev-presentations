/*
 * theme.js — design tokens shared by every D3 diagram in this project.
 *
 * The palette is the colourblind-safe set already used in the user's LaTeX
 * decks (seaborn "colorblind"), so TikZ figures and D3 figures match.
 *
 *   positive  blue    primary / "ours" / correct
 *   negative  orange  contrast / limitation / baseline
 *   emphasis  green   highlight / key result
 *   purple            fourth series
 *   neutral   grey    context, axes, de-emphasised series
 *
 * Import it, never hard-code hex values in a diagram:
 *   import { theme, SERIES } from "./theme.js";
 *   const t = theme(dark);
 */

export const PALETTE = {
  positive: "#0173B2",
  negative: "#DE8F05",
  emphasis: "#029E73",
  purple: "#CC78BC",
  neutral: "#8C8C8C",
};

// categorical order for multi-series charts (colourblind-safe, no red/green pair)
export const SERIES = ["#0173B2", "#DE8F05", "#029E73", "#CC78BC", "#8C8C8C", "#1A1A1A"];

const DARK_SERIES = ["#4FA8DC", "#F0A93B", "#3FC79A", "#DDA0D0", "#A6A6A6", "#EDEDED"];

export function theme(dark = false) {
  if (dark) {
    return {
      dark: true,
      bg: "transparent",
      ink: "#F2F2F2",
      inkMuted: "#B4B4B4",
      inkFaint: "#8A8A8A",
      grid: "#3B3B3B",
      rule: "#5C5C5C",
      panel: "#1E1E1E",
      positive: DARK_SERIES[0],
      negative: DARK_SERIES[1],
      emphasis: DARK_SERIES[2],
      purple: DARK_SERIES[3],
      neutral: DARK_SERIES[4],
      series: DARK_SERIES,
      positiveFill: "rgba(79,168,220,0.18)",
      negativeFill: "rgba(240,169,59,0.18)",
      emphasisFill: "rgba(63,199,154,0.18)",
    };
  }
  return {
    dark: false,
    bg: "transparent",
    ink: "#0B0C0C",
    inkMuted: "#505A5F",
    inkFaint: "#8A8A8A",
    grid: "#E3E5E7",
    rule: "#B1B4B6",
    panel: "#F3F6F8",
    positive: PALETTE.positive,
    negative: PALETTE.negative,
    emphasis: PALETTE.emphasis,
    purple: PALETTE.purple,
    neutral: PALETTE.neutral,
    series: SERIES,
    positiveFill: "rgba(1,115,178,0.14)",
    negativeFill: "rgba(222,143,5,0.16)",
    emphasisFill: "rgba(2,158,115,0.16)",
  };
}

/** Font stack — one family per label role, no webfonts to embed. */
export const FONT = {
  sans: '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif',
  mono: '"SF Mono", ui-monospace, Menlo, Consolas, monospace',
};
