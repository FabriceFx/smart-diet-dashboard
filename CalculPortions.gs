/**
 * Outil Diététique Clinique - Moteur de Calcul par Résolution Itérative (Solver)
 *
 * NOTE SUR L'ALGORITHME : L'équilibrage des assiettes utilise une descente coordonnée heuristique.
 * Chaque catégorie (viandes, féculents, graisses) ajuste sa portion proportionnellement 
 * à l'écart constaté sur son macro-nutriment de prédilection (protéines, glucides, lipides).
 * Le système converge naturellement en ~10-15 itérations car les matrices croisées
 * (ex: glucides dans la viande) sont négligeables dans ce modèle simplifié.
 */

const DEFAULT_EQUIVALENCES = {
  viandes: {
    "Viande rouge / blanche (maigre)": { prot: 0.25, glu: 0.0, lip: 0.05, type: "g", ref: 100 },
    "Poisson / Crustacés": { prot: 0.20, glu: 0.0, lip: 0.02, type: "g", ref: 100 },
    "Œufs (unités)": { prot: 6.0, glu: 0.0, lip: 5.0, type: "unite", ref: "" },
    "Saumon fumé": { prot: 0.22, glu: 0.0, lip: 0.10, type: "g", ref: 40 },
    "Tofu / Tempeh": { prot: 0.15, glu: 0.02, lip: 0.08, type: "g", ref: 100 },
    "Steak haché 5% MG": { prot: 0.21, glu: 0.0, lip: 0.05, type: "g", ref: 100 },
    "Thon au naturel (boîte)": { prot: 0.25, glu: 0.0, lip: 0.01, type: "g", ref: 100 },
    "Saumon frais": { prot: 0.20, glu: 0.0, lip: 0.13, type: "g", ref: 100 }
  },
  feculents: {
    "Pomme de terre": { prot: 0.02, glu: 0.17, lip: 0.0, type: "g", ref: 150 },
    "Pâtes / Riz (cuits)": { prot: 0.05, glu: 0.30, lip: 0.01, type: "g", ref: 100 },
    "Semoule (cuite)": { prot: 0.04, glu: 0.28, lip: 0.01, type: "g", ref: 100 },
    "Légumes secs (cuits)": { prot: 0.08, glu: 0.20, lip: 0.01, type: "g", ref: 100 },
    "Pain de mie / céréales": { prot: 0.09, glu: 0.50, lip: 0.04, type: "g", ref: 40 },
    "Purée": { prot: 0.02, glu: 0.15, lip: 0.05, type: "g", ref: 150 },
    "Quinoa / Boulgour (cuits)": { prot: 0.04, glu: 0.21, lip: 0.02, type: "g", ref: 100 },
    "Patate douce (cuite)": { prot: 0.02, glu: 0.20, lip: 0.0, type: "g", ref: 150 },
    "Flocons d'avoine": { prot: 0.13, glu: 0.60, lip: 0.07, type: "g", ref: 40 },
    "Pain complet": { prot: 0.09, glu: 0.45, lip: 0.02, type: "g", ref: 40 }
  },
  matieres_grasses: {
    "Huile d'olive (c.à.s)": { prot: 0.0, glu: 0.0, lip: 10.0, type: "unite", ref: "" },
    "Beurre": { prot: 0.0, glu: 0.0, lip: 0.80, type: "g", ref: 10 },
    "Amandes / Noix": { prot: 0.20, glu: 0.10, lip: 0.50, type: "g", ref: 15 },
    "Avocat (demi)": { prot: 2.0, glu: 5.0, lip: 15.0, type: "unite", ref: "" },
    "Huile de colza / noix (c.à.s)": { prot: 0.0, glu: 0.0, lip: 10.0, type: "unite", ref: "" },
    "Beurre de cacahuète / Purée d'amande": { prot: 0.25, glu: 0.15, lip: 0.50, type: "g", ref: 15 },
    "Chocolat noir >70%": { prot: 0.08, glu: 0.35, lip: 0.40, type: "g", ref: 10 }
  },
  produits_laitiers: {
    "Yaourt nature": { prot: 5.0, glu: 6.0, lip: 1.5, type: "fixe", ref: "" },
    "Fromage blanc (100g)": { prot: 8.0, glu: 4.0, lip: 3.0, type: "fixe", ref: "" },
    "Petit-suisse (60g)": { prot: 6.0, glu: 2.0, lip: 2.0, type: "fixe", ref: "" },
    "Fromage (30g)": { prot: 7.0, glu: 0.0, lip: 9.0, type: "fixe", ref: "" },
    "Skyr (100g)": { prot: 10.0, glu: 4.0, lip: 0.0, type: "fixe", ref: "" },
    "Lait 1/2 écrémé (verre)": { prot: 6.0, glu: 9.0, lip: 3.0, type: "fixe", ref: "" },
    "Lait d'amande sans sucre (verre)": { prot: 1.0, glu: 0.5, lip: 3.0, type: "fixe", ref: "" },
    "Lait de soja (verre)": { prot: 8.0, glu: 2.0, lip: 4.0, type: "fixe", ref: "" },
    "Mozzarella / Feta (30g)": { prot: 5.0, glu: 0.5, lip: 6.0, type: "fixe", ref: "" }
  },
  fruits: {
    "Pomme / Poire / Orange": { prot: 0.0, glu: 15.0, lip: 0.0, type: "fixe", ref: "" },
    "Kiwis": { prot: 0.0, glu: 10.0, lip: 0.0, type: "fixe", ref: "" },
    "Clémentines / Abricots": { prot: 0.0, glu: 15.0, lip: 0.0, type: "fixe", ref: "" },
    "Banane (demi)": { prot: 1.0, glu: 15.0, lip: 0.0, type: "fixe", ref: "" },
    "Compote sans sucre (100g)": { prot: 0.0, glu: 12.0, lip: 0.0, type: "fixe", ref: "" },
    "Fraises / Fruits rouges (barquette)": { prot: 1.0, glu: 10.0, lip: 0.0, type: "fixe", ref: "" },
    "Melon / Ananas (1/4)": { prot: 1.0, glu: 10.0, lip: 0.0, type: "fixe", ref: "" },
    "Pêche / Nectarine": { prot: 1.0, glu: 10.0, lip: 0.0, type: "fixe", ref: "" },
    "Mangue (1/2)": { prot: 1.0, glu: 15.0, lip: 0.0, type: "fixe", ref: "" },
    "Raisin (petite grappe)": { prot: 0.0, glu: 15.0, lip: 0.0, type: "fixe", ref: "" }
  },
  legumes: {
    "Légumes verts (portion 200g)": { prot: 4.0, glu: 10.0, lip: 1.0, type: "fixe", ref: "" },
    "Carottes / Légumes racines (200g)": { prot: 2.0, glu: 16.0, lip: 0.4, type: "fixe", ref: "" },
    "Tomates / Légumes d'été (200g)": { prot: 2.0, glu: 8.0, lip: 0.4, type: "fixe", ref: "" },
    "Salade (portion 100g)": { prot: 1.0, glu: 2.0, lip: 0.2, type: "fixe", ref: "" },
    "Champignons (portion 150g)": { prot: 3.0, glu: 4.5, lip: 0.3, type: "fixe", ref: "" },
    "Brocoli / Chou-fleur (200g)": { prot: 6.0, glu: 8.0, lip: 1.0, type: "fixe", ref: "" }
  }
};

const NIVEAUX_ACTIVITE = {
  "Sédentaire (peu ou pas d'exercice)": 1.2,
  "Léger (exercice 1-3 j/sem)": 1.375,
  "Modéré (exercice 3-5 j/sem)": 1.55,
  "Actif (exercice 6-7 j/sem)": 1.725,
  "Très actif (physique)": 1.9
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🍎 Menu Diététique')
      .addItem('1. Générer le Dashboard interactif', 'creerModeleFeuille')
      .addItem('2. Exporter le Bilan Patient (PDF)', 'exporterPDF')
      .addItem('3. Générer l\'onglet de Suivi Poids', 'creerFeuilleSuivi')
      .addItem('4. Rafraîchir les listes d\'aliments', 'rafraichirListesAliments')
      .addToUi();
}

/** Utilitaires de Base de Données d'Aliments */

function initialiserBaseAliments(ss) {
  let sheetDb = ss.getSheetByName("Base Aliments");
  if (!sheetDb) {
    sheetDb = ss.insertSheet("Base Aliments");
  } else {
    return sheetDb;
  }
  
  sheetDb.getRange("A1:G1").setValues([["Catégorie", "Aliment", "Protéines (g ou %)", "Glucides (g ou %)", "Lipides (g ou %)", "Type", "Portion Réf (g)"]]).setFontWeight("bold").setBackground("#f3f3f3");
  sheetDb.getRange("C1:E1").setNote("Pour le type 'g' (pesée), indiquez la fraction (ex: 0.25 = 25%).\nPour 'unite' ou 'fixe', indiquez la valeur brute par portion.");
  sheetDb.getRange("G1").setNote("Utilisé uniquement pour le type 'g'.\nPoids de référence d'un 'échange' (ex: 40 pour le pain, 150 pour la pomme de terre, 100 par défaut).");
  
  let rows = [];
  for(let cat in DEFAULT_EQUIVALENCES) {
    for(let nom in DEFAULT_EQUIVALENCES[cat]) {
      let item = DEFAULT_EQUIVALENCES[cat][nom];
      rows.push([cat, nom, item.prot, item.glu, item.lip, item.type, item.ref]);
    }
  }
  
  sheetDb.getRange(2, 1, rows.length, 7).setValues(rows);
  
  const ruleType = SpreadsheetApp.newDataValidation().requireValueInList(["g", "unite", "fixe"], true).build();
  sheetDb.getRange(2, 6, 1000, 1).setDataValidation(ruleType);
  
  sheetDb.autoResizeColumns(1, 7);
  return sheetDb;
}

function chargerEquivalences() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetDb = ss.getSheetByName("Base Aliments");
  if (!sheetDb) {
    sheetDb = initialiserBaseAliments(ss);
  }
  
  const data = sheetDb.getDataRange().getValues();
  let equivalences = {};
  
  for(let i=1; i<data.length; i++) {
    let cat = data[i][0];
    let nom = data[i][1];
    let prot = parseFloat(data[i][2]) || 0;
    let glu = parseFloat(data[i][3]) || 0;
    let lip = parseFloat(data[i][4]) || 0;
    let type = data[i][5];
    let refCell = data[i][6];
    let ref = (refCell !== undefined && refCell !== "") ? parseFloat(refCell) : (type === "g" ? 100 : "");
    
    if (!cat || !nom) continue;
    
    if (!equivalences[cat]) equivalences[cat] = {};
    equivalences[cat][nom] = { prot: prot, glu: glu, lip: lip, type: type, ref: isNaN(ref) ? 100 : ref };
  }
  
  return equivalences;
}

function creerModeleFeuille() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // S'assurer que la base d'aliments existe et la charger
  const equivalences = chargerEquivalences();
  
  let sheet = ss.getSheetByName("Dashboard Diététique");
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName("Dashboard Diététique");
  }
  ss.setActiveSheet(sheet);
  sheet.clear(); 
  
  sheet.getRange("A1:B1").setValues([["CONFIGURATION PATIENT", "VALEURS"]]).setFontWeight("bold").setBackground("#d9ead3");
  sheet.getRange("A2:A7").setValues([
    ["Poids actuel (kg)"], ["Taille (cm)"], ["Âge (années)"], ["Sexe (Homme/Femme)"], ["Poids cible (kg)"], ["Niveau d'activité"]
  ]);
  sheet.getRange("B2:B7").setValues([[80], [175], [35], ["Femme"], [75], ["Léger (exercice 1-3 j/sem)"]]).setBackground("#e6f3ff");
  
  sheet.getRange("D1:E1").setValues([["MACRO-NUTRIMENTS", "OBJECTIF"]]).setFontWeight("bold").setBackground("#d9ead3");
  sheet.getRange("D2:D4").setValues([["Protéines (%)"], ["Glucides (%)"], ["Lipides (%)"]]);
  sheet.getRange("E2:E4").setValues([[30], [40], [30]]).setBackground("#e6f3ff");
  
  sheet.getRange("D5:D6").setValues([["TDEE (Maintien)"], ["Cible Calorique"]]).setFontWeight("bold").setBackground("#f3f3f3");
  sheet.getRange("E5:E6").setValues([["..."], ["..."]]).setBackground("#fff2cc").setFontWeight("bold");
  
  const regleSexe = SpreadsheetApp.newDataValidation().requireValueInList(["Homme", "Femme"], true).build();
  sheet.getRange("B5").setDataValidation(regleSexe);
  
  const regleActivite = SpreadsheetApp.newDataValidation().requireValueInList(Object.keys(NIVEAUX_ACTIVITE), true).build();
  sheet.getRange("B7").setDataValidation(regleActivite);
  
  sheet.showColumns(1, sheet.getMaxColumns()); 
  
  sheet.getRange("A9:C9").merge().setValue("PROGRAMME ALIMENTAIRE PERSONNALISÉ").setFontWeight("bold").setHorizontalAlignment("center").setBackground("#ffe599");
  sheet.getRange("A10:C10").setValues([["REPAS", "ALIMENTS (Cliquez pour changer)", "QUANTITÉ CALCULÉE"]]).setFontWeight("bold").setBackground("#f3f3f3");
  
  const menusParams = [
    ["Petit-déjeuner", "Café / Thé", null],
    ["", "Yaourt nature", "produits_laitiers"],
    ["", "Pain de mie / céréales", "feculents"],
    ["", "Beurre", "matieres_grasses"],
    ["", "Pomme / Poire / Orange", "fruits"],
    ["", "Viande rouge / blanche (maigre)", "viandes"],
    ["", "", null],
    ["Déjeuner", "Viande rouge / blanche (maigre)", "viandes"],
    ["", "Pomme de terre", "feculents"],
    ["", "Légumes verts (portion 200g)", "legumes"],
    ["", "Yaourt nature", "produits_laitiers"],
    ["", "Pomme / Poire / Orange", "fruits"],
    ["", "Huile d'olive (c.à.s)", "matieres_grasses"],
    ["", "", null],
    ["Goûter", "Pain de mie / céréales", "feculents"],
    ["", "Fromage (30g)", "produits_laitiers"],
    ["", "Pomme / Poire / Orange", "fruits"],
    ["", "", null],
    ["Dîner", "Viande rouge / blanche (maigre)", "viandes"],
    ["", "Pomme de terre", "feculents"],
    ["", "Légumes verts (portion 200g)", "legumes"],
    ["", "Yaourt nature", "produits_laitiers"],
    ["", "Huile d'olive (c.à.s)", "matieres_grasses"]
  ];

  const values = [];
  const backgrounds = [];
  const validations = [];
  
  menusParams.forEach(([repas, typeAliment, category]) => {
    if (typeAliment === "") {
      values.push(["", "", ""]);
      backgrounds.push(["#ffffff", "#ffffff", "#ffffff"]);
      validations.push([null, null, null]);
      return;
    }
    
    let rowValues = [repas, "", ""];
    let rowBackgrounds = ["#ffffff", "#ffffff", "#ffffff"];
    let rowValidations = [null, null, null];
    
    if (category && equivalences[category] && Object.keys(equivalences[category]).length > 0) {
      const choix = Object.keys(equivalences[category]);
      const rule = SpreadsheetApp.newDataValidation().requireValueInList(choix, true).build();
      rowValidations[1] = rule;
      const defaultVal = choix.includes(typeAliment) ? typeAliment : choix[0];
      rowValues[1] = defaultVal;
      rowBackgrounds[1] = "#fff2cc";
      rowValues[2] = "...";
    } else if (category) {
      rowValues[1] = typeAliment;
      rowValues[2] = "⚠️ Catégorie vide";
    } else {
      rowValues[1] = typeAliment;
      rowValues[2] = "Libre";
    }
    
    values.push(rowValues);
    backgrounds.push(rowBackgrounds);
    validations.push(rowValidations);
  });
  
  const range = sheet.getRange(11, 1, values.length, 3);
  range.setValues(values);
  range.setBackgrounds(backgrounds);
  range.setDataValidations(validations);

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 300);
  sheet.setColumnWidth(3, 200);
  
  recalculerMenu();
}

function rafraichirListesAliments() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dashboard Diététique");
  if (!sheet) return;
  const equivalences = chargerEquivalences();
  const startRow = getStartRow(sheet);
  const numRows = Math.max(1, sheet.getLastRow() - startRow + 1);
  const menuData = sheet.getRange(startRow, 1, numRows, 2).getValues();
  
  menuData.forEach((row, i) => {
    const aliment = row[1];
    const cat = getCategoryOfAliment(aliment, equivalences);
    if (cat) {
      const choix = Object.keys(equivalences[cat]);
      const rule = SpreadsheetApp.newDataValidation().requireValueInList(choix, true).build();
      sheet.getRange(startRow + i, 2).setDataValidation(rule);
    } else if (aliment) {
      sheet.getRange(startRow + i, 3).setValue("⚠️ Aliment introuvable");
    }
  });
  
  recalculerMenu();
  SpreadsheetApp.getActiveSpreadsheet().toast("Listes et quantités mises à jour !", "✅ Succès");
}

/** Utilitaires sécurisés */
function getNum(sheet, rangeA1, defaultVal) {
  const raw = parseFloat(sheet.getRange(rangeA1).getValue());
  return isNaN(raw) ? defaultVal : raw;
}

function escapeHtml(unsafe) {
  return (unsafe || "").toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStartRow(sheet) {
  let startRow = 11;
  const headerSearch = sheet.getRange("A5:A15").getValues();
  for(let i=0; i<headerSearch.length; i++) {
    if (headerSearch[i][0] === "REPAS") {
      startRow = i + 5 + 1;
      break;
    }
  }
  return startRow;
}

function getCategoryOfAliment(aliment, equivalences) {
  for (let cat in equivalences) {
    if (equivalences[cat][aliment]) return cat;
  }
  return null;
}

/**
 * Calcul du Profil Métabolique centralisé
 */
function calculerProfilMetabolique(sheet) {
  const poids = getNum(sheet, "B2", 80);
  const taille = getNum(sheet, "B3", 175);
  const age = getNum(sheet, "B4", 35);
  const sexe = String(sheet.getRange("B5").getValue()) || "Femme";
  const poidsCible = getNum(sheet, "B6", poids);
  const activiteStr = String(sheet.getRange("B7").getValue());
  const activiteFactor = NIVEAUX_ACTIVITE[activiteStr] || 1.375;
  
  let messages = [];
  
  // Calcul du déficit dynamique (plafond clinique 25%)
  const kilosAPerdre = Math.max(0, poids - poidsCible);
  if (poids < poidsCible) messages.push("📈 Prise de masse (Déficit bloqué à 0).");
  
  const deficitPct = Math.min(25, kilosAPerdre * 2);
  if (kilosAPerdre * 2 > 25) messages.push("🔒 Plafond atteint (Déficit bloqué à -25%).");
  
  let bmr = (10 * poids) + (6.25 * taille) - (5 * age);
  bmr += (sexe.toLowerCase() === "homme") ? 5 : -161;
  const tdee = bmr * activiteFactor;
  
  // Planchers de sécurité calorique
  const plancher = (sexe.toLowerCase() === "homme") ? 1500 : 1200;
  const caloriesUncapped = tdee * (1 - deficitPct/100);
  const caloriesCibles = Math.max(plancher, caloriesUncapped); 
  if (caloriesUncapped < plancher) messages.push(`🛡️ Plancher vital atteint (Bloqué à ${plancher} kcal).`);
  
  const deficitJournalier = Math.max(0, tdee - caloriesCibles);
  const perteHebdo = (deficitJournalier * 7) / 7700;
  
  return { poids, poidsCible, tdee, caloriesCibles, perteHebdo, messages };
}

/**
 * Déclencheur qui s'active à chaque modification dans la feuille
 */
function onEdit(e) {
  if (!e) return;
  const range = e.range;
  const sheet = e.source.getActiveSheet();
  
  // Si on modifie la base aliments, pas besoin de recalculer tout de suite,
  // ou on pourrait, mais on va surtout recalculer quand le Dashboard est actif.
  if (sheet.getName() === "Dashboard Diététique" && range.getRow() <= 40 && range.getColumn() <= 5) {
    try {
      recalculerMenu(range);
    } catch(err) {
      e.source.toast("Erreur de calcul : " + err.message, "Alerte Script");
    }
  } else if (sheet.getName() === "Base Aliments") {
    try {
      recalculerMenu();
    } catch(err) {
      e.source.toast("Erreur base aliments : " + err.message, "Alerte Script");
    }
  }
}

/**
 * L'Algorithme Solver de recalcul clinique
 */
function recalculerMenu(editedRange = null) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dashboard Diététique");
  if (!sheet) return;
  
  const profil = calculerProfilMetabolique(sheet);
  const equivalences = chargerEquivalences();
  
  // Retour visuel au praticien
  sheet.getRange("E5").setValue(Math.round(profil.tdee) + " kcal");
  sheet.getRange("E6").setValue(Math.round(profil.caloriesCibles) + " kcal");
  
  // Afficher les alertes cliniques si le praticien est en train de modifier le profil patient
  if (editedRange && editedRange.getColumn() === 2 && editedRange.getRow() >= 2 && editedRange.getRow() <= 7) {
    if (profil.messages && profil.messages.length > 0) {
      SpreadsheetApp.getActiveSpreadsheet().toast(profil.messages.join("\n"), "ℹ️ Limites Cliniques", 6);
    }
  }
  
  const pctProt = getNum(sheet, "E2", 30);
  const pctGlu = getNum(sheet, "E3", 40);
  const pctLip = getNum(sheet, "E4", 30);
  
  // Validation Clinique des Macros
  if (Math.abs((pctProt + pctGlu + pctLip) - 100) > 0.1) {
    SpreadsheetApp.getActiveSpreadsheet().toast("⚠️ Vos objectifs macros ne font pas 100% au total !", "Alerte de vérification", 4);
  }
  
  const targetProt = (profil.caloriesCibles * (pctProt/100)) / 4;
  const targetGlu = (profil.caloriesCibles * (pctGlu/100)) / 4;
  const targetLip = (profil.caloriesCibles * (pctLip/100)) / 9;
  
  const startRow = getStartRow(sheet);
  const numRows = Math.max(1, sheet.getLastRow() - startRow + 1);
  
  // 2. Lire le menu
  const menuData = sheet.getRange(startRow, 2, numRows, 1).getValues();
  let fixedProt = 0, fixedGlu = 0, fixedLip = 0;
  let dynamicRows = [];
  
  for(let i=0; i<menuData.length; i++) {
    const aliment = menuData[i][0];
    if (!aliment || aliment === "") continue;
    const cat = getCategoryOfAliment(aliment, equivalences);
    
    if (cat && equivalences[cat] && equivalences[cat][aliment]) {
      let item = equivalences[cat][aliment];
      if (item.type === "fixe") {
        fixedProt += item.prot;
        fixedGlu += item.glu;
        fixedLip += item.lip;
      } else {
        dynamicRows.push({ rowObj: i + startRow, cat: cat, item: item });
      }
    }
  }
  
  // 3. Algorithme de résolution itérative
  let portions = {};
  dynamicRows.forEach(d => { portions[d.rowObj] = d.item.ref || (d.item.type === 'g' ? 100 : 1); });
  
  for(let iter=0; iter<15; iter++) {
    let sumProt = fixedProt;
    let sumGlu = fixedGlu;
    let sumLip = fixedLip;
    
    dynamicRows.forEach(d => {
      let q = portions[d.rowObj];
      sumProt += d.item.prot * q;
      sumGlu += d.item.glu * q;
      sumLip += d.item.lip * q;
    });
    
    // Garde-fous mathématiques pour la division par zéro
    let protRatio = sumProt > 0 ? targetProt / sumProt : 1;
    let gluRatio = sumGlu > 0 ? targetGlu / sumGlu : 1;
    let lipRatio = sumLip > 0 ? targetLip / sumLip : 1;
    
    dynamicRows.forEach(d => {
      if (d.cat === "viandes") portions[d.rowObj] *= protRatio;
      if (d.cat === "feculents") portions[d.rowObj] *= gluRatio;
      if (d.cat === "matieres_grasses") portions[d.rowObj] *= lipRatio;
    });
  }
  
  // 4. Écrire les résultats
  dynamicRows.forEach(d => {
    let qte = portions[d.rowObj];
    let texte = "";
    if (d.item.type === "unite") {
      let u = Math.max(1, Math.round(qte));
      texte = u + (u <= 1 ? " unité" : " unités");
    } else {
      texte = (Math.round(qte / 5) * 5) + " g";
    }
    sheet.getRange(d.rowObj, 3).setValue(texte);
  });
  
  for(let i=0; i<menuData.length; i++) {
    const aliment = menuData[i][0];
    const cat = getCategoryOfAliment(aliment, equivalences);
    if (cat && equivalences[cat] && equivalences[cat][aliment] && equivalences[cat][aliment].type === "fixe") {
      sheet.getRange(i + startRow, 3).setValue("1 portion");
    }
  }
}

function exporterPDF() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dashboard Diététique");
  if (!sheet) {
    ui.alert("Veuillez générer le Dashboard Diététique en premier.");
    return;
  }
  
  const response = ui.prompt("Exportation PDF", "Saisissez le nom du patient :", ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const nomPatient = escapeHtml(response.getResponseText()) || "Patient";
  
  const responseEmail = ui.prompt("Envoi par Email (Optionnel)", "Saisissez l'adresse email du patient (laissez vide pour ignorer) :", ui.ButtonSet.OK_CANCEL);
  let emailPatient = "";
  if (responseEmail.getSelectedButton() === ui.Button.OK) {
    emailPatient = escapeHtml(responseEmail.getResponseText().trim());
  }
  
  let sheetSuivi = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Suivi Poids");
  if (!sheetSuivi) {
    creerFeuilleSuivi();
    sheetSuivi = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Suivi Poids");
    SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
  }
  
  let chartHtml = "";
  if (sheetSuivi && sheetSuivi.getCharts().length > 0) {
    const chartBlob = sheetSuivi.getCharts()[0].getBlob().getAs("image/png");
    const base64Image = Utilities.base64Encode(chartBlob.getBytes());
    chartHtml = `
      <div style="margin-top: 40px; text-align: center; page-break-inside: avoid;">
        <h3 style="color: #202124; font-weight: 500; font-size: 18px; margin-bottom: 15px;">Trajectoire prévisionnelle de perte de poids</h3>
        <img src="data:image/png;base64,${base64Image}" style="max-width: 100%; border-radius: 8px; border: 1px solid #e8eaed;" />
      </div>
    `;
  }
  
  const startRow = getStartRow(sheet);
  const numRows = Math.max(1, sheet.getLastRow() - startRow + 1);
  const menuData = sheet.getRange(startRow, 1, numRows, 3).getValues();
  
  let tableRows = "";
  menuData.forEach(row => {
    if (row[1] !== "") {
      const repasStr = row[0] !== "" ? `<span style="color: #1a73e8; font-weight: 500;">${escapeHtml(row[0])}</span>` : "";
      tableRows += `<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f3f4; color: #3c4043;">${repasStr}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f3f4; color: #3c4043;">${escapeHtml(row[1])}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f3f4; font-weight: 500; color: #d93025;">${escapeHtml(row[2])}</td></tr>`;
    }
  });

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Google Sans', Roboto, Arial, sans-serif; padding: 40px; max-width: 800px; margin: auto; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 10px; margin-bottom: 30px;">
        <h1 style="color: #202124; margin: 0; font-size: 28px; font-weight: 400;">Bilan diététique personnalisé</h1>
        <p style="font-size: 16px; color: #5f6368; margin-top: 8px;">Programme élaboré pour <b>${nomPatient}</b></p>
        <hr style="border: 0; border-bottom: 1px solid #e8eaed; margin-top: 25px; width: 50%;">
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 35px; border: 1px solid #e8eaed;">
        <h3 style="color: #202124; margin-top: 0; font-weight: 500; font-size: 18px;">Objectifs du programme</h3>
        <p style="margin: 6px 0; color: #3c4043; font-size: 14px;"><b>Patiente :</b> ${getNum(sheet, "B2", 80)} kg (Cible : ${getNum(sheet, "B6", 80)} kg), ${getNum(sheet, "B3", 175)} cm, ${getNum(sheet, "B4", 35)} ans</p>
        <p style="margin: 6px 0; color: #3c4043; font-size: 14px;"><b>Répartition journalière :</b> Protéines ${getNum(sheet, "E2", 30)}% | Glucides ${getNum(sheet, "E3", 40)}% | Lipides ${getNum(sheet, "E4", 30)}%</p>
      </div>
      
      <table border="0" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
        <tr style="background-color: #f1f3f4;">
          <th style="padding: 12px 8px; text-align: left; width: 25%; color: #202124; font-weight: 500; font-size: 14px; border-top-left-radius: 8px; border-bottom-left-radius: 8px;">Moment de la journée</th>
          <th style="padding: 12px 8px; text-align: left; width: 45%; color: #202124; font-weight: 500; font-size: 14px;">Aliments proposés</th>
          <th style="padding: 12px 8px; text-align: left; width: 30%; color: #202124; font-weight: 500; font-size: 14px; border-top-right-radius: 8px; border-bottom-right-radius: 8px;">Quantité recommandée</th>
        </tr>
        ${tableRows}
      </table>
      
      ${chartHtml}
      
      <div style="margin-top: 50px; font-size: 11px; color: #7f8c8d; border-top: 1px solid #e8eaed; padding-top: 15px;">
        <p style="margin: 3px 0;">* Notes cliniques sur les méthodes de calcul algorithmique utilisées :</p>
        <ul style="margin-top: 3px; padding-left: 15px;">
          <li>Le métabolisme de base (TDEE) est estimé via l'équation de Mifflin-St Jeor avec intégration du facteur d'activité déclaré.</li>
          <li>Le déficit calorique est proportionnel à l'objectif de poids, plafonné à -25% pour limiter le risque de sous-nutrition. Un plancher absolu de sécurité (1200 kcal femme / 1500 kcal homme) est imposé.</li>
          <li>La courbe prédictive postule qu'un déficit cumulé de 7700 kcal correspond en moyenne physiologique à 1 kg de masse grasse perdue (donnée standard heuristique).</li>
        </ul>
      </div>
    </body>
    </html>
  `;
  
  const htmlBlob = HtmlService.createHtmlOutput(htmlTemplate).getBlob();
  const pdfBlob = htmlBlob.getAs(MimeType.PDF);
  pdfBlob.setName("Bilan_Dietetique_" + nomPatient + ".pdf");
  
  const dossierName = "Bilans Diététiques";
  let folders = DriveApp.getRootFolder().getFoldersByName(dossierName);
  let dossier = folders.hasNext() ? folders.next() : DriveApp.getRootFolder().createFolder(dossierName);
  
  dossier.createFile(pdfBlob);
  
  if (emailPatient !== "") {
    const emailHtml = `
      <div style="font-family: 'Google Sans', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #dadce0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #202124; font-weight: 400;">Votre Programme Diététique</h2>
        </div>
        <p style="color: #3c4043; font-size: 16px; line-height: 1.5;">Bonjour <b>${nomPatient}</b>,</p>
        <p style="color: #3c4043; font-size: 16px; line-height: 1.5;">Veuillez trouver ci-joint votre bilan diététique personnalisé, établi suite à notre consultation.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #5f6368; font-size: 14px;">Ce document PDF interactif contient :</p>
          <ul style="color: #3c4043; font-size: 14px; padding-left: 20px;">
            <li>Vos objectifs caloriques et macro-nutritionnels</li>
            <li>Votre plan alimentaire structuré sur la journée</li>
            <li>Les équivalences en portions personnalisées</li>
          </ul>
        </div>
        <p style="color: #3c4043; font-size: 16px; line-height: 1.5;">Je reste à votre entière disposition pour tout ajustement ou question.</p>
        <br>
        <p style="color: #5f6368; font-size: 14px; margin-bottom: 0;">Bien à vous,</p>
        <p style="color: #202124; font-weight: 500; font-size: 16px; margin-top: 5px;">Votre Praticien</p>
      </div>
    `;
    
    MailApp.sendEmail({
      to: emailPatient,
      subject: "Votre Programme Diététique Personnalisé",
      htmlBody: emailHtml,
      attachments: [pdfBlob]
    });
    
    ui.alert("✅ Succès !", "Le Bilan PDF a été généré dans le Drive et envoyé par email à " + emailPatient + ".", ui.ButtonSet.OK);
  } else {
    ui.alert("✅ Succès !", "Le Bilan PDF a été généré dans votre Drive.", ui.ButtonSet.OK);
  }
}

function creerFeuilleSuivi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = ss.getSheetByName("Dashboard Diététique");
  if (!mainSheet) {
    SpreadsheetApp.getUi().alert("Veuillez générer le Dashboard Diététique en premier.");
    return;
  }
  
  const profil = calculerProfilMetabolique(mainSheet);

  let sheetSuivi = ss.getSheetByName("Suivi Poids");
  if (!sheetSuivi) {
    sheetSuivi = ss.insertSheet("Suivi Poids");
  } else {
    sheetSuivi.clear();
    const charts = sheetSuivi.getCharts();
    charts.forEach(c => sheetSuivi.removeChart(c));
  }
  
  sheetSuivi.getRange("A1:B1").setValues([["CONFIGURATION SUIVI", "VALEURS"]]).setFontWeight("bold").setBackground("#d9ead3");
  sheetSuivi.getRange("A2").setValue("Date de début");
  sheetSuivi.getRange("B2").setValue(new Date()).setBackground("#e6f3ff");
  
  sheetSuivi.getRange("A4:D4").setValues([["Semaine", "Date", "Poids Théorique (kg)", "Poids Réel (kg)"]]).setFontWeight("bold").setBackground("#f3f3f3");
  
  let currentPoids = profil.poids;
  const values = [];
  const backgrounds = [];
  
  for(let i=0; i<=20; i++) {
    let semaine = i;
    let dateFormula = i === 0 ? "=B2" : `=B2 + (A${5+i}*7)`;
    let theorique = Math.round(currentPoids * 100) / 100;
    
    if (currentPoids > profil.poidsCible) {
      currentPoids -= profil.perteHebdo;
      if (currentPoids < profil.poidsCible) currentPoids = profil.poidsCible;
    }
    
    values.push([semaine, dateFormula, theorique, i===0 ? profil.poids : ""]);
    backgrounds.push(["#ffffff", "#ffffff", "#ffffff", i===0 ? "#ffffff" : "#fff2cc"]);
  }
  
  const range = sheetSuivi.getRange(5, 1, values.length, 4);
  range.setValues(values);
  range.setBackgrounds(backgrounds);
  sheetSuivi.getRange(5, 2, values.length, 1).setNumberFormat("dd/MM/yyyy");
  
  const chartBuilder = sheetSuivi.newChart()
    .asLineChart()
    .addRange(sheetSuivi.getRange(4, 2, values.length + 1, 1))
    .addRange(sheetSuivi.getRange(4, 3, values.length + 1, 1))
    .addRange(sheetSuivi.getRange(4, 4, values.length + 1, 1))
    .setPosition(4, 6, 0, 0)
    .setOption('title', 'Suivi de la Perte de Poids (Théorique vs Réel)')
    .setOption('curveType', 'function')
    .setOption('legend', {position: 'bottom'})
    .setOption('vAxis', {title: 'Poids (kg)'})
    .setOption('hAxis', {title: 'Date'})
    .setOption('series', {
       0: { color: '#bdc3c7', lineDashStyle: [4, 4] },
       1: { color: '#3498db', lineWidth: 3, pointSize: 7 }
     });
     
  sheetSuivi.insertChart(chartBuilder.build());
  
  sheetSuivi.setColumnWidth(1, 100);
  sheetSuivi.setColumnWidth(2, 120);
  sheetSuivi.setColumnWidth(3, 150);
  sheetSuivi.setColumnWidth(4, 150);
  
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheetSuivi);
}
