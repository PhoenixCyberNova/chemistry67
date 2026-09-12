/** Common Class 10 names, formulae and everyday aliases used by global search. */

export const ALIASES: Record<string, string[]> = {
  hcl: ["hydrochloric acid", "hydrogen chloride", "muriatic acid", "acid"],
  "hydrochloric acid": ["hcl", "hydrogen chloride", "acid"],
  h2so4: ["sulphuric acid", "sulfuric acid", "oil of vitriol", "acid"],
  "sulphuric acid": ["h2so4", "sulfuric acid", "acid"],
  hno3: ["nitric acid", "aqua fortis", "acid"],
  "nitric acid": ["hno3", "acid"],
  naoh: ["sodium hydroxide", "caustic soda", "lye", "base", "alkali"],
  "sodium hydroxide": ["naoh", "caustic soda", "base"],
  koh: ["potassium hydroxide", "caustic potash", "base"],
  caoh2: ["calcium hydroxide", "slaked lime", "lime water", "base"],
  "slaked lime": ["calcium hydroxide", "ca(oh)2", "lime water"],
  cao: ["calcium oxide", "quicklime", "lime"],
  "quicklime": ["cao", "calcium oxide"],
  caco3: ["calcium carbonate", "limestone", "marble", "chalk", "lime water milky"],
  "lime water": ["calcium hydroxide", "ca(oh)2", "caco3"],
  nahco3: ["sodium hydrogencarbonate", "sodium bicarbonate", "baking soda", "antacid"],
  "baking soda": ["nahco3", "sodium hydrogencarbonate"],
  na2co3: ["sodium carbonate", "washing soda", "soda ash"],
  "washing soda": ["na2co3", "na2co3·10h2o", "sodium carbonate decahydrate"],
  caocl2: ["bleaching powder", "calcium oxychloride"],
  "bleaching powder": ["caocl2", "calcium oxychloride"],
  caso4: ["gypsum", "plaster of paris", "pop"],
  gypsum: ["caso4·2h2o", "plaster of paris"],
  "plaster of paris": ["pop", "caso4·½h2o", "gypsum"],
  cuso4: ["copper sulphate", "copper sulfate", "blue vitriol"],
  "blue vitriol": ["cuso4·5h2o", "copper sulphate"],
  feso4: ["ferrous sulphate", "green vitriol", "iron(ii) sulphate"],
  fe2o3: ["ferric oxide", "iron(iii) oxide", "rust", "haematite"],
  rust: ["fe2o3·xh2o", "corrosion", "hydrated ferric oxide"],
  pbo: ["lead oxide", "litharge"],
  pbno3: ["lead nitrate"],
  pbi2: ["lead iodide", "yellow precipitate"],
  agcl: ["silver chloride", "photography"],
  agbr: ["silver bromide", "photography"],
  zno: ["zinc oxide", "yellow when hot", "white when cold"],
  cuo: ["copper oxide", "black copper oxide"],
  ch4: ["methane", "natural gas"],
  c2h4: ["ethene", "ethylene", "unsaturated"],
  c2h2: ["ethyne", "acetylene"],
  c2h5oh: ["ethanol", "ethyl alcohol", "alcohol"],
  ethanol: ["c2h5oh", "alcohol", "spirit"],
  ch3cooh: ["ethanoic acid", "acetic acid", "vinegar"],
  "ethanoic acid": ["acetic acid", "vinegar", "ch3cooh"],
  vinegar: ["ethanoic acid", "acetic acid", "ch3cooh"],
  "ethyl ethanoate": ["ester", "ch3cooc2h5", "fruity smell"],
  ester: ["ethyl ethanoate", "esterification", "fruity"],
  soap: ["saponification", "micelle", "sodium salt"],
  detergent: ["hard water", "scum"],
  thermite: ["fe2o3 + al", "welding railway tracks", "aluminothermy"],
  roasting: ["sulphide ore", "excess air", "so2"],
  calcination: ["carbonate ore", "limited air", "co2"],
  "chlor-alkali": ["brine", "nacl electrolysis", "naoh", "cl2", "h2"],
  brine: ["aqueous nacl", "chlor-alkali"],
  redox: ["oxidation", "reduction", "oxidised", "reduced"],
  acid: ["hcl", "h2so4", "hno3", "ethanoic acid", "h+"],
  base: ["naoh", "koh", "ca(oh)2", "oh-"],
  indicator: ["litmus", "methyl orange", "phenolphthalein", "universal"],
  ph: ["hydrogen ion", "acidic", "basic", "neutral"],
  catenation: ["carbon chain", "self linking"],
  homologous: ["ch2", "same functional group"],
};

export function expandAliases(q: string): string[] {
  const raw = q.trim().toLowerCase();
  if (!raw) return [];
  const extra = new Set<string>([raw]);
  for (const [k, vals] of Object.entries(ALIASES)) {
    if (raw.includes(k) || k.includes(raw)) {
      extra.add(k);
      for (const v of vals) extra.add(v);
    }
    for (const v of vals) {
      if (raw.includes(v) || v.includes(raw)) {
        extra.add(k);
        extra.add(v);
        for (const x of vals) extra.add(x);
      }
    }
  }
  return [...extra];
}
