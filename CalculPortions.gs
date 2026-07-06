/**
 * Outil Diététique Clinique - Moteur de Calcul par Résolution Itérative (Solver)
 */

const EQUIVALENCES = {
  viandes: {
    "Viande rouge / blanche (maigre)": { prot: 0.25, glu: 0.0, lip: 0.05, type: "g" },
    "Poisson / Crustacés": { prot: 0.20, glu: 0.0, lip: 0.02, type: "g" },
    "Œufs (unités)": { prot: 6.0, glu: 0.0, lip: 5.0, type: "unite" },
    "Saumon fumé": { prot: 0.22, glu: 0.0, lip: 0.10, type: "g" },
    "Tofu / Tempeh": { prot: 0.15, glu: 0.02, lip: 0.08, type: "g" }
  },
  feculents: {
    "Pomme de terre": { prot: 0.02, glu: 0.17, lip: 0.0, type: "g" },
    "Pâtes / Riz (cuits)": { prot: 0.05, glu: 0.30, lip: 0.01, type: "g" },
    "Semoule (cuite)": { prot: 0.04, glu: 0.28, lip: 0.01, type: "g" },
    "Légumes secs (cuits)": { prot: 0.08, glu: 0.20, lip: 0.01, type: "g" },
    "Pain de mie / céréales": { prot: 0.09, glu: 0.50, lip: 0.04, type: "g" },
    "Purée": { prot: 0.02, glu: 0.15, lip: 0.05, type: "g" }
  },
  matieres_grasses: {
    "Huile d'olive (c.à.s)": { prot: 0.0, glu: 0.0, lip: 10.0, type: "unite" },
    "Beurre": { prot: 0.0, glu: 0.0, lip: 0.80, type: "g" },
    "Amandes / Noix": { prot: 0.20, glu: 0.10, lip: 0.50, type: "g" },
    "Avocat (demi)": { prot: 2.0, glu: 5.0, lip: 15.0, type: "unite" }
  },
  produits_laitiers: {
    "Yaourt nature": { prot: 5.0, glu: 6.0, lip: 1.5, type: "fixe" },
    "Fromage blanc (100g)": { prot: 8.0, glu: 4.0, lip: 3.0, type: "fixe" },
    "Petit-suisse (60g)": { prot: 6.0, glu: 2.0, lip: 2.0, type: "fixe" },
    "Fromage (30g)": { prot: 7.0, glu: 0.0, lip: 9.0, type: "fixe" },
    "Skyr (100g)": { prot: 10.0, glu: 4.0, lip: 0.0, type: "fixe" },
    "Lait 1/2 écrémé (verre)": { prot: 6.0, glu: 9.0, lip: 3.0, type: "fixe" }
  },
  fruits: {
    "Pomme / Poire / Orange": { prot: 0.0, glu: 15.0, lip: 0.0, type: "fixe" },
    "Kiwis": { prot: 0.0, glu: 10.0, lip: 0.0, type: "fixe" },
    "Clémentines / Abricots": { prot: 0.0, glu: 15.0, lip: 0.0, type: "fixe" },
    "Banane (demi)": { prot: 1.0, glu: 15.0, lip: 0.0, type: "fixe" },
    "Compote sans sucre (100g)": { prot: 0.0, glu: 12.0, lip: 0.0, type: "fixe" },
    "Fraises / Fruits rouges (barquette)": { prot: 1.0, glu: 10.0, lip: 0.0, type: "fixe" },
    "Melon / Ananas (1/4)": { prot: 1.0, glu: 10.0, lip: 0.0, type: "fixe" }
  }
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🍎 Menu Diététique')
      .addItem('1. Générer le Dashboard interactif', 'creerModeleFeuille')
      .addItem('2. Exporter le Bilan Patient (PDF)', 'exporterPDF')
      .addItem('3. Générer l\'onglet de Suivi Poids', 'creerFeuilleSuivi')
      .addToUi();
}

function creerModeleFeuille() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Dashboard Diététique");
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName("Dashboard Diététique");
  }
  ss.setActiveSheet(sheet);
  sheet.clear(); 
  
  sheet.getRange("A1:B1").setValues([["CONFIGURATION PATIENT", "VALEURS"]]).setFontWeight("bold").setBackground("#d9ead3");
  sheet.getRange("A2:A6").setValues([
    ["Poids actuel (kg)"], ["Taille (cm)"], ["Âge (années)"], ["Sexe (Homme/Femme)"], ["Poids cible (kg)"]
  ]);
  sheet.getRange("B2:B6").setValues([[80], [175], [35], ["Femme"], [75]]).setBackground("#e6f3ff");
  
  sheet.getRange("D1:E1").setValues([["MACRO-NUTRIMENTS", "OBJECTIF"]]).setFontWeight("bold").setBackground("#d9ead3");
  sheet.getRange("D2:D4").setValues([["Protéines (%)"], ["Glucides (%)"], ["Lipides (%)"]]);
  sheet.getRange("E2:E4").setValues([[30], [40], [30]]).setBackground("#e6f3ff");
  
  sheet.getRange("D5:D6").setValues([["TDEE (Maintien)"], ["Cible Calorique"]]).setFontWeight("bold").setBackground("#f3f3f3");
  sheet.getRange("E5:E6").setValues([["..."], ["..."]]).setBackground("#fff2cc").setFontWeight("bold");
  
  const regleSexe = SpreadsheetApp.newDataValidation().requireValueInList(["Homme", "Femme"], true).build();
  sheet.getRange("B5").setDataValidation(regleSexe);
  
  sheet.showColumns(1, sheet.getMaxColumns()); // S'assurer que rien n'est caché
  
  sheet.getRange("A8:C8").merge().setValue("PROGRAMME ALIMENTAIRE PERSONNALISÉ").setFontWeight("bold").setHorizontalAlignment("center").setBackground("#ffe599");
  sheet.getRange("A9:C9").setValues([["REPAS", "ALIMENTS (Cliquez pour changer)", "QUANTITÉ CALCULÉE"]]).setFontWeight("bold").setBackground("#f3f3f3");
  
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
    ["", "Légumes crus/cuits", null],
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
    ["", "Légumes", null],
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
    
    if (category && EQUIVALENCES[category]) {
      const choix = Object.keys(EQUIVALENCES[category]);
      const rule = SpreadsheetApp.newDataValidation().requireValueInList(choix, true).build();
      rowValidations[1] = rule;
      const defaultVal = choix.includes(typeAliment) ? typeAliment : choix[0];
      rowValues[1] = defaultVal;
      rowBackgrounds[1] = "#fff2cc";
      rowValues[2] = "...";
    } else {
      rowValues[1] = typeAliment;
      rowValues[2] = "Libre";
    }
    
    values.push(rowValues);
    backgrounds.push(rowBackgrounds);
    validations.push(rowValidations);
  });
  
  const range = sheet.getRange(10, 1, values.length, 3);
  range.setValues(values);
  range.setBackgrounds(backgrounds);
  range.setDataValidations(validations);

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 300);
  sheet.setColumnWidth(3, 200);
  
  recalculerMenu();
}

function getCategoryOfAliment(aliment) {
  for (let cat in EQUIVALENCES) {
    if (EQUIVALENCES[cat][aliment]) return cat;
  }
  return null;
}

/**
 * Déclencheur qui s'active à chaque modification dans la feuille
 */
function onEdit(e) {
  if (!e) return;
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  const row = range.getRow();
  const col = range.getColumn();
  
  // Si on modifie la config (A1:E6) ou un aliment (C10:C40)
  if (row <= 40) {
    recalculerMenu();
  }
}

/**
 * L'Algorithme Solver de recalcul clinique
 */
function recalculerMenu() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dashboard Diététique");
  if (!sheet) return;
  
  // 1. Lire la config
  const poids = parseFloat(sheet.getRange("B2").getValue()) || 80;
  const taille = parseFloat(sheet.getRange("B3").getValue()) || 175;
  const age = parseFloat(sheet.getRange("B4").getValue()) || 35;
  const sexe = String(sheet.getRange("B5").getValue()) || "Femme";
  const poidsCible = parseFloat(sheet.getRange("B6").getValue()) || poids;
  
  // Calcul du déficit dynamique : 2% de déficit par kilo à perdre (plafonné à 25% max pour la santé)
  const kilosAPerdre = Math.max(0, poids - poidsCible);
  const deficitPct = Math.min(25, kilosAPerdre * 2);
  
  const pctProt = (parseFloat(sheet.getRange("E2").getValue()) || 30) / 100;
  const pctGlu = (parseFloat(sheet.getRange("E3").getValue()) || 40) / 100;
  const pctLip = (parseFloat(sheet.getRange("E4").getValue()) || 30) / 100;
  
  // TDEE & Cibles
  let bmr = (10 * poids) + (6.25 * taille) - (5 * age);
  bmr += (sexe.toLowerCase() === "homme") ? 5 : -161;
  const tdee = bmr * 1.375;
  const caloriesCibles = Math.max(1200, tdee * (1 - deficitPct/100)); 
  
  // Retour visuel au praticien
  sheet.getRange("E5").setValue(Math.round(tdee) + " kcal");
  sheet.getRange("E6").setValue(Math.round(caloriesCibles) + " kcal");
  
  const targetProt = (caloriesCibles * pctProt) / 4;
  const targetGlu = (caloriesCibles * pctGlu) / 4;
  const targetLip = (caloriesCibles * pctLip) / 9;
  
  // 2. Lire le menu
  const menuData = sheet.getRange("B10:B40").getValues();
  let fixedProt = 0, fixedGlu = 0, fixedLip = 0;
  let dynamicRows = [];
  
  for(let i=0; i<menuData.length; i++) {
    const aliment = menuData[i][0];
    if (!aliment || aliment === "") continue;
    const cat = getCategoryOfAliment(aliment);
    
    if (cat && EQUIVALENCES[cat] && EQUIVALENCES[cat][aliment]) {
      let item = EQUIVALENCES[cat][aliment];
      if (item.type === "fixe") {
        fixedProt += item.prot;
        fixedGlu += item.glu;
        fixedLip += item.lip;
      } else {
        dynamicRows.push({ rowObj: i+10, cat: cat, item: item });
      }
    }
  }
  
  // 3. Algorithme de résolution itérative (Solver)
  let portions = {};
  dynamicRows.forEach(d => { portions[d.rowObj] = d.item.type === 'g' ? 100 : 1; });
  
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
    
    let protRatio = targetProt / sumProt;
    let gluRatio = targetGlu / sumGlu;
    let lipRatio = targetLip / sumLip;
    
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
      texte = Math.max(1, Math.round(qte)) + " unité(s)";
    } else {
      texte = (Math.round(qte / 5) * 5) + " g";
    }
    sheet.getRange(d.rowObj, 3).setValue(texte);
  });
  
  for(let i=0; i<menuData.length; i++) {
    const aliment = menuData[i][0];
    const cat = getCategoryOfAliment(aliment);
    if (cat && EQUIVALENCES[cat] && EQUIVALENCES[cat][aliment] && EQUIVALENCES[cat][aliment].type === "fixe") {
      sheet.getRange(i+10, 3).setValue("1 portion");
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
  const nomPatient = response.getResponseText() || "Patient";
  
  const responseEmail = ui.prompt("Envoi par Email (Optionnel)", "Saisissez l'adresse email du patient (laissez vide pour ignorer) :", ui.ButtonSet.OK_CANCEL);
  let emailPatient = "";
  if (responseEmail.getSelectedButton() === ui.Button.OK) {
    emailPatient = responseEmail.getResponseText().trim();
  }
  
  // S'assurer que le graphique existe
  let sheetSuivi = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Suivi Poids");
  if (!sheetSuivi) {
    creerFeuilleSuivi();
    sheetSuivi = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Suivi Poids");
    SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet); // Revenir au dashboard
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
  
  const menuData = sheet.getRange("A10:C40").getValues();
  let tableRows = "";
  menuData.forEach(row => {
    if (row[1] !== "") {
      const repasStr = row[0] !== "" ? `<span style="color: #1a73e8; font-weight: 500;">${row[0]}</span>` : "";
      tableRows += `<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f3f4; color: #3c4043;">${repasStr}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f3f4; color: #3c4043;">${row[1]}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f3f4; font-weight: 500; color: #d93025;">${row[2]}</td></tr>`;
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
        <p style="margin: 6px 0; color: #3c4043; font-size: 14px;"><b>Patiente :</b> ${sheet.getRange("B2").getValue()} kg (Cible : ${sheet.getRange("B6").getValue()} kg), ${sheet.getRange("B3").getValue()} cm, ${sheet.getRange("B4").getValue()} ans</p>
        <p style="margin: 6px 0; color: #3c4043; font-size: 14px;"><b>Répartition journalière :</b> Protéines ${sheet.getRange("E2").getValue()}% | Glucides ${sheet.getRange("E3").getValue()}% | Lipides ${sheet.getRange("E4").getValue()}%</p>
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
  
  const poidsActuel = parseFloat(mainSheet.getRange("B2").getValue()) || 80;
  const poidsCible = parseFloat(mainSheet.getRange("B6").getValue()) || poidsActuel;
  
  const kilosAPerdre = Math.max(0, poidsActuel - poidsCible);
  const deficitPct = Math.min(25, kilosAPerdre * 2);
  
  const taille = parseFloat(mainSheet.getRange("B3").getValue()) || 175;
  const age = parseFloat(mainSheet.getRange("B4").getValue()) || 35;
  const sexe = String(mainSheet.getRange("B5").getValue()) || "Femme";
  let bmr = (10 * poidsActuel) + (6.25 * taille) - (5 * age);
  bmr += (sexe.toLowerCase() === "homme") ? 5 : -161;
  const tdee = bmr * 1.375;
  
  const deficitJournalier = tdee * (deficitPct / 100);
  const perteHebdo = (deficitJournalier * 7) / 7700;

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
  
  let currentPoids = poidsActuel;
  const values = [];
  const backgrounds = [];
  
  for(let i=0; i<=20; i++) {
    let semaine = i;
    let dateFormula = i === 0 ? "=B2" : `=B2 + (A${5+i}*7)`;
    let theorique = Math.round(currentPoids * 100) / 100; // Doit rester un nombre, pas un string !
    
    if (currentPoids > poidsCible) {
      currentPoids -= perteHebdo;
      if (currentPoids < poidsCible) currentPoids = poidsCible;
    }
    
    values.push([semaine, dateFormula, theorique, i===0 ? poidsActuel : ""]);
    backgrounds.push(["#ffffff", "#ffffff", "#ffffff", i===0 ? "#ffffff" : "#fff2cc"]);
  }
  
  const range = sheetSuivi.getRange(5, 1, values.length, 4);
  range.setValues(values);
  range.setBackgrounds(backgrounds);
  sheetSuivi.getRange(5, 2, values.length, 1).setNumberFormat("dd/MM/yyyy");
  
  const chartBuilder = sheetSuivi.newChart()
    .asLineChart()
    .addRange(sheetSuivi.getRange(4, 2, values.length + 1, 1)) // X: Dates
    .addRange(sheetSuivi.getRange(4, 3, values.length + 1, 1)) // Y1: Théorique
    .addRange(sheetSuivi.getRange(4, 4, values.length + 1, 1)) // Y2: Réel
    .setPosition(4, 6, 0, 0)
    .setOption('title', 'Suivi de la Perte de Poids (Théorique vs Réel)')
    .setOption('curveType', 'function')
    .setOption('legend', {position: 'bottom'})
    .setOption('vAxis', {title: 'Poids (kg)'})
    .setOption('hAxis', {title: 'Date'})
    .setOption('series', {
       0: { color: '#bdc3c7', lineDashStyle: [4, 4] },
       1: { color: '#3498db', lineWidth: 3, pointSize: 7 } // pointSize permet d'afficher le point même sans 2ème valeur
     });
     
  sheetSuivi.insertChart(chartBuilder.build());
  
  sheetSuivi.setColumnWidth(1, 100);
  sheetSuivi.setColumnWidth(2, 120);
  sheetSuivi.setColumnWidth(3, 150);
  sheetSuivi.setColumnWidth(4, 150);
  
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheetSuivi);
}
