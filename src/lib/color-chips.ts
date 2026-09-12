export type ColorChip = { hex: string; label: string };

const RULES: { re: RegExp; hex: string; label: string }[] = [
  { re: /\bsilvery\s*white\b/i, hex: "#d6dde6", label: "silvery white" },
  { re: /\bpale\s*yellow\b/i, hex: "#fde68a", label: "pale yellow" },
  { re: /\bgreenish[-\s]?yellow\b/i, hex: "#a3e635", label: "greenish-yellow" },
  { re: /\breddish[-\s]?brown\b/i, hex: "#b45309", label: "reddish-brown" },
  { re: /\byellowish[-\s]?brown\b/i, hex: "#b45309", label: "yellowish-brown" },
  { re: /\bbluish[-\s]?green\b/i, hex: "#0d9488", label: "bluish-green" },
  { re: /\bpale\s*green\b/i, hex: "#86efac", label: "pale green" },
  { re: /\bdazzling white\b/i, hex: "#f8fafc", label: "dazzling white" },
  { re: /\bshiny white\b/i, hex: "#f8fafc", label: "shiny white" },
  { re: /\bbrown fumes\b|\bbrown gas\b|\bbrown no/i, hex: "#9a3412", label: "brown" },
  { re: /\bpurple\b/i, hex: "#6b21a8", label: "purple" },
  { re: /\borange\b/i, hex: "#ea580c", label: "orange" },
  { re: /\bviolet\b/i, hex: "#5b21b6", label: "violet" },
  { re: /\bpink\b/i, hex: "#f472b6", label: "pink" },
  { re: /\bgrey\b|\bgray\b/i, hex: "#6b7280", label: "grey" },
  { re: /\bgreen\b/i, hex: "#22c55e", label: "green" },
  { re: /\bbrown\b/i, hex: "#92400e", label: "brown" },
  { re: /\byellow\b/i, hex: "#eab308", label: "yellow" },
  { re: /\bblue\b/i, hex: "#1e90ff", label: "blue" },
  { re: /\bblack\b/i, hex: "#111827", label: "black" },
  { re: /\bwhite\b/i, hex: "#f8fafc", label: "white" },
  { re: /\bmilky\b/i, hex: "#f1f5f9", label: "milky" },
  { re: /\bcolourless\b|\bcolorless\b/i, hex: "#e5e7eb", label: "colourless" },
];

export function chipsFromColour(text: string): ColorChip[] {
  const found: ColorChip[] = [];
  const seen = new Set<string>();
  for (const rule of RULES) {
    if (!rule.re.test(text)) continue;
    if (seen.has(rule.label)) continue;
    seen.add(rule.label);
    found.push({ hex: rule.hex, label: rule.label });
  }
  return found.slice(0, 4);
}
