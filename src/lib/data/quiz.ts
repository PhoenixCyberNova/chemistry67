export type ChapterId = "ch1" | "ch2" | "ch3" | "ch4";

export type QuizKind = "mcq" | "assertion" | "case";
export type QuizMark = "1" | "2" | "3";

export type QuizItem = {
  q: string;
  options: string[];
  ans: number;
  why?: string;
  kind?: QuizKind;
  mark?: QuizMark;
};


export const quizData: Record<ChapterId, QuizItem[]> = {
  ch1: [
    {
      q: "Which of the following is a decomposition reaction?",
      options: ["2Mg + O₂ → 2MgO", "CaCO₃ → CaO + CO₂", "Zn + CuSO₄ → ZnSO₄ + Cu", "NaOH + HCl → NaCl + H₂O"],
      ans: 1
    },
    {
      q: "When silver chloride is exposed to sunlight, it turns grey because of the formation of:",
      options: ["Silver oxide", "Silver carbonate", "Silver metal", "Silver nitrate"],
      ans: 2
    },
    {
      q: "The brown fumes evolved on heating lead nitrate are of:",
      options: ["NO", "N₂O", "NO₂", "N₂O₅"],
      ans: 2
    },
    {
      q: "In the reaction Fe + CuSO₄ → FeSO₄ + Cu, the colour change observed is:",
      options: ["Blue to green", "Green to blue", "Blue to colourless", "Green to colourless"],
      ans: 0
    },
    {
      q: "Which of the following is an example of a photolytic decomposition reaction?",
      options: ["2FeSO₄ → Fe₂O₃ + SO₂ + SO₃", "2AgBr → 2Ag + Br₂", "CaCO₃ → CaO + CO₂", "2H₂O → 2H₂ + O₂"],
      ans: 1
    },
    {
      q: "Respiration is regarded as an exothermic reaction because:",
      options: ["Glucose is broken down", "Energy is absorbed", "Energy is released", "Oxygen is used"],
      ans: 2
    },
    {
      q: "The reaction 2H₂ + O₂ → 2H₂O is an example of:",
      options: ["Decomposition", "Displacement", "Combination", "Double displacement"],
      ans: 2
    },
    {
      q: "Rancidity can be prevented by:",
      options: ["Keeping food in airtight containers", "Adding antioxidants", "Flushing with nitrogen", "All of these"],
      ans: 3
    },
    {
      q: "In the electrolysis of water, the gas collected at the cathode is:",
      options: ["Oxygen", "Hydrogen", "Chlorine", "Nitrogen"],
      ans: 1
    },
    {
      q: "Which of the following reactions is a redox reaction?",
      options: ["NaOH + HCl → NaCl + H₂O", "BaCl₂ + Na₂SO₄ → BaSO₄ + 2NaCl", "CuO + H₂ → Cu + H₂O", "CaCO₃ → CaO + CO₂"],
      ans: 2
    },
    {
      q: "The white precipitate formed when BaCl₂ reacts with Na₂SO₄ is:",
      options: ["BaSO₃", "BaSO₄", "BaCl₂", "NaCl"],
      ans: 1
    },
    {
      q: "Quick lime reacts with water to form:",
      options: ["Limestone", "Slaked lime", "Calcium carbonate", "Calcium sulphate"],
      ans: 1
    },
    {
      q: "Which metal is more reactive than iron but less reactive than zinc?",
      options: ["Cu", "Pb", "Al", "None of these (according to series)"],
      ans: 3
    },
    {
      q: "The chemical formula of rust is:",
      options: ["FeO", "Fe₂O₃", "Fe₂O₃·xH₂O", "Fe₃O₄"],
      ans: 2
    },
    {
      q: "When copper is heated in air, the black coating formed is of:",
      options: ["Cu₂O", "CuO", "CuCO₃", "Cu(OH)₂"],
      ans: 1
    },
    {
      q: "In the reaction Zn + H₂SO₄ → ZnSO₄ + H₂, zinc is:",
      options: ["Oxidised", "Reduced", "Neither", "Both"],
      ans: 0
    },
    {
      q: "A solution of AgNO₃ is mixed with NaCl. The precipitate formed is:",
      options: ["White and soluble", "White and insoluble", "Yellow and insoluble", "No precipitate"],
      ans: 1
    },
    {
      q: "Which of the following is not a combination reaction?",
      options: ["CaO + H₂O → Ca(OH)₂", "2H₂ + O₂ → 2H₂O", "CaCO₃ → CaO + CO₂", "C + O₂ → CO₂"],
      ans: 2
    },
    {
      q: "The reaction used in whitewashing is:",
      options: ["CaO + H₂O → Ca(OH)₂", "Ca(OH)₂ + CO₂ → CaCO₃ + H₂O", "Both A and B", "None"],
      ans: 2
    },
    {
      q: "Which gas is produced when dilute HCl reacts with zinc?",
      options: ["CO₂", "H₂", "Cl₂", "O₂"],
      ans: 1
    }
  ],

  ch2: [
    {
      q: "The chemical formula of bleaching powder is:",
      options: ["CaCl₂", "CaOCl₂", "Ca(OCl)₂", "CaO"],
      ans: 1
    },
    {
      q: "When CO₂ is passed through lime water, it turns milky due to the formation of:",
      options: ["CaO", "Ca(OH)₂", "CaCO₃", "Ca(HCO₃)₂"],
      ans: 2
    },
    {
      q: "On passing excess CO₂ through the milky lime water, the milkiness disappears because of the formation of:",
      options: ["CaCO₃", "Ca(HCO₃)₂", "CaO", "CaCl₂"],
      ans: 1
    },
    {
      q: "Plaster of Paris is obtained by heating gypsum at:",
      options: ["100°C", "373 K", "573 K", "273 K"],
      ans: 1
    },
    {
      q: "The products of chlor-alkali process are:",
      options: ["NaOH, Cl₂, H₂", "NaCl, Cl₂, H₂", "NaOH, HCl, H₂", "Na₂CO₃, Cl₂, H₂"],
      ans: 0
    },
    {
      q: "Which of the following is an olfactory indicator?",
      options: ["Litmus", "Phenolphthalein", "Onion", "Methyl orange"],
      ans: 2
    },
    {
      q: "Baking soda on heating gives:",
      options: ["Na₂CO₃ + H₂O + CO₂", "NaOH + CO₂", "NaCl + H₂O", "Na₂O + CO₂"],
      ans: 0
    },
    {
      q: "The pH of pure water is:",
      options: ["0", "7", "14", "1"],
      ans: 1
    },
    {
      q: "Which acid is present in vinegar?",
      options: ["Citric acid", "Acetic acid", "Lactic acid", "Formic acid"],
      ans: 1
    },
    {
      q: "Tooth enamel is made of:",
      options: ["Calcium carbonate", "Calcium phosphate", "Calcium sulphate", "Calcium chloride"],
      ans: 1
    },
    {
      q: "Aqueous solution of sodium carbonate is:",
      options: ["Acidic", "Basic", "Neutral", "Amphoteric"],
      ans: 1
    },
    {
      q: "Which of the following salts does not contain water of crystallisation?",
      options: ["Blue vitriol", "Washing soda", "Baking soda", "Gypsum"],
      ans: 2
    },
    {
      q: "The reaction between an acid and a base to form salt and water is called:",
      options: ["Combination", "Decomposition", "Neutralisation", "Displacement"],
      ans: 2
    },
    {
      q: "When zinc reacts with sodium hydroxide, the gas evolved is:",
      options: ["CO₂", "H₂", "O₂", "Cl₂"],
      ans: 1
    },
    {
      q: "Methyl orange shows which colour in basic medium?",
      options: ["Red", "Yellow", "Pink", "Colourless"],
      ans: 1
    },
    {
      q: "Phenolphthalein is colourless in:",
      options: ["Acidic medium", "Basic medium", "Neutral medium", "Both acidic and neutral"],
      ans: 0
    },
    {
      q: "The chemical name of washing soda is:",
      options: ["Sodium carbonate", "Sodium hydrogen carbonate", "Sodium carbonate decahydrate", "Sodium hydroxide"],
      ans: 2
    },
    {
      q: "Gypsum is:",
      options: ["CaSO₄·½H₂O", "CaSO₄·2H₂O", "CaSO₄", "CaOCl₂"],
      ans: 1
    },
    {
      q: "Which of the following is used as an antacid?",
      options: ["NaOH", "NaHCO₃", "Na₂CO₃", "CaOCl₂"],
      ans: 1
    },
    {
      q: "In the reaction CuO + 2HCl → CuCl₂ + H₂O, CuO acts as:",
      options: ["Acid", "Base", "Salt", "Indicator"],
      ans: 1
    }
  ],

  ch3: [
    {
      q: "Which of the following metals reacts vigorously with cold water?",
      options: ["Mg", "Al", "Na", "Zn"],
      ans: 2
    },
    {
      q: "The correct order of reactivity is:",
      options: ["Zn > Fe > Cu", "Cu > Fe > Zn", "Fe > Zn > Cu", "Zn > Cu > Fe"],
      ans: 0
    },
    {
      q: "Aluminium oxide is:",
      options: ["Acidic", "Basic", "Amphoteric", "Neutral"],
      ans: 2
    },
    {
      q: "The process of coating iron with zinc is called:",
      options: ["Anodising", "Galvanisation", "Electroplating", "Alloying"],
      ans: 1
    },
    {
      q: "Thermite reaction is used for:",
      options: ["Extraction of iron", "Welding railway tracks", "Making alloys", "Purification of metals"],
      ans: 1
    },
    {
      q: "Roasting is done for which type of ores?",
      options: ["Carbonate", "Sulphide", "Oxide", "Chloride"],
      ans: 1
    },
    {
      q: "Calcination is done for which type of ores?",
      options: ["Sulphide", "Carbonate", "Oxide", "Nitrate"],
      ans: 1
    },
    {
      q: "Which metal is stored under kerosene?",
      options: ["Mg", "Al", "Na", "Zn"],
      ans: 2
    },
    {
      q: "The chemical formula of rust is:",
      options: ["FeO", "Fe₂O₃", "Fe₂O₃·xH₂O", "Fe₃O₄"],
      ans: 2
    },
    {
      q: "Which of the following is an ionic compound?",
      options: ["CH₄", "H₂O", "NaCl", "CO₂"],
      ans: 2
    },
    {
      q: "In the reactivity series, hydrogen is placed between:",
      options: ["Cu and Ag", "Pb and Cu", "Fe and Pb", "Zn and Fe"],
      ans: 1
    },
    {
      q: "Zinc oxide is:",
      options: ["Acidic", "Basic", "Amphoteric", "Neutral"],
      ans: 2
    },
    {
      q: "Which gas is evolved when a metal reacts with dilute acid?",
      options: ["CO₂", "H₂", "O₂", "N₂"],
      ans: 1
    },
    {
      q: "Anodising is done for which metal?",
      options: ["Iron", "Copper", "Aluminium", "Zinc"],
      ans: 2
    },
    {
      q: "In the reaction ZnO + C → Zn + CO, carbon acts as:",
      options: ["Oxidising agent", "Reducing agent", "Catalyst", "None"],
      ans: 1
    },
    {
      q: "Which of the following metals does not react with dilute HCl?",
      options: ["Zn", "Fe", "Cu", "Mg"],
      ans: 2
    },
    {
      q: "The property of metals by which they can be beaten into thin sheets is called:",
      options: ["Ductility", "Malleability", "Sonority", "Conductivity"],
      ans: 1
    },
    {
      q: "Brass is an alloy of:",
      options: ["Cu and Zn", "Cu and Sn", "Cu and Ni", "Fe and Cr"],
      ans: 0
    },
    {
      q: "Bronze is an alloy of:",
      options: ["Cu and Zn", "Cu and Sn", "Cu and Al", "Fe and Ni"],
      ans: 1
    },
    {
      q: "Which of the following is not a method to prevent corrosion?",
      options: ["Painting", "Galvanisation", "Alloying", "Heating the metal"],
      ans: 3
    }
  ],

  ch4: [
    {
      q: "The number of covalent bonds in methane is:",
      options: ["1", "2", "3", "4"],
      ans: 3
    },
    {
      q: "Which of the following is an unsaturated hydrocarbon?",
      options: ["CH₄", "C₂H₆", "C₂H₄", "C₃H₈"],
      ans: 2
    },
    {
      q: "The functional group present in ethanol is:",
      options: ["–CHO", "–COOH", "–OH", "–CO"],
      ans: 2
    },
    {
      q: "Esterification reaction is the reaction between:",
      options: ["Acid and base", "Acid and alcohol", "Alcohol and sodium", "Acid and sodium carbonate"],
      ans: 1
    },
    {
      q: "The catalyst used in hydrogenation of oils is:",
      options: ["Fe", "Ni", "Pt", "Both Ni and Pt"],
      ans: 3
    },
    {
      q: "Saponification is the process of:",
      options: ["Making soap", "Making ester", "Making alcohol", "Making acid"],
      ans: 0
    },
    {
      q: "Ethene on hydrogenation gives:",
      options: ["Ethane", "Ethyne", "Methane", "Propane"],
      ans: 0
    },
    {
      q: "The reaction of ethanol with sodium gives:",
      options: ["Sodium ethoxide + H₂", "Sodium acetate + H₂", "Sodium carbonate + H₂", "No reaction"],
      ans: 0
    },
    {
      q: "Dehydration of ethanol with conc. H₂SO₄ at 443 K gives:",
      options: ["Ethane", "Ethene", "Ethyne", "Methane"],
      ans: 1
    },
    {
      q: "Which of the following compounds has a fruity smell?",
      options: ["Ethanol", "Ethanoic acid", "Ethyl ethanoate", "Methane"],
      ans: 2
    },
    {
      q: "The molecular formula of ethanoic acid is:",
      options: ["CH₃OH", "CH₃COOH", "C₂H₅OH", "HCOOH"],
      ans: 1
    },
    {
      q: "Carbon forms a large number of compounds mainly due to:",
      options: ["Tetravalency only", "Catenation only", "Both tetravalency and catenation", "Ductility"],
      ans: 2
    },
    {
      q: "In a homologous series, successive members differ by:",
      options: ["CH₃", "CH₂", "CH", "C₂H₅"],
      ans: 1
    },
    {
      q: "Which type of reaction is shown by saturated hydrocarbons with chlorine in sunlight?",
      options: ["Addition", "Substitution", "Combustion", "Decomposition"],
      ans: 1
    },
    {
      q: "Soaps do not work well in hard water because:",
      options: ["They form scum", "They are acidic", "They are basic", "They evaporate"],
      ans: 0
    },
    {
      q: "The structure of methane is:",
      options: ["Linear", "Planar", "Tetrahedral", "Pyramidal"],
      ans: 2
    },
    {
      q: "Which of the following is used as a fuel as well as a solvent?",
      options: ["Methane", "Ethanol", "Ethanoic acid", "Ethene"],
      ans: 1
    },
    {
      q: "Vinegar is a dilute solution of:",
      options: ["Ethanol", "Ethanoic acid", "Methanol", "Formic acid"],
      ans: 1
    },
    {
      q: "The reaction CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O is catalysed by:",
      options: ["NaOH", "Conc. H₂SO₄", "Ni", "Pt"],
      ans: 1
    },
    {
      q: "Micelles are formed by:",
      options: ["Acids", "Bases", "Soap molecules in water", "Hydrocarbons"],
      ans: 2
    }
  ]
};
