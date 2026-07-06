# 🍏 Smart Diet Dashboard

**Smart Diet Dashboard** est un outil professionnel et interactif basé sur Google Sheets et Google Apps Script. Il est conçu pour les diététiciens et les professionnels de la santé afin de générer automatiquement des programmes alimentaires personnalisés, d'exporter des bilans PDF élégants et de suivre la perte de poids des patients.

## ✨ Fonctionnalités Principales

- **Moteur "Solver" Macros-Nutritionnel** : Un algorithme itératif en arrière-plan qui recalcule instantanément (via `onEdit`) les portions exactes (viandes, féculents, lipides) pour respecter les cibles caloriques et macro-nutritionnelles.
- **Base de Données Intégrée** : Contient les profils nutritionnels (Protéines, Glucides, Lipides) des aliments les plus courants.
- **Calcul de Déficit Intelligent** : Calcule le métabolisme de base (TDEE via la formule Mifflin-St Jeor) et applique un déficit calorique sur-mesure (plafonné à 25%) en fonction de l'écart entre le poids actuel et le poids cible.
- **Suivi Long Terme & Graphiques** : Génération d'un onglet de suivi avec projection des dates, calcul de la trajectoire de poids idéale, et un graphique interactif (Théorique vs Réel).
- **Exportation PDF & Email "Google Style"** : Génération d'un bilan diététique au format PDF stocké automatiquement sur Google Drive, avec possibilité de l'envoyer directement par email au patient via un template HTML moderne.

## 🛠️ Technologies Utilisées

- **Google Sheets** : Interface utilisateur (Dashboard).
- **Google Apps Script (ES6)** : Logique métier, interface utilisateur personnalisée (`SpreadsheetApp.getUi()`), création de PDF (`HtmlService`), et envoi d'emails (`MailApp`).
- **Google Drive API** : Stockage et archivage des bilans générés.

## 🚀 Installation & Utilisation

1. Créez un nouveau document Google Sheets.
2. Ouvrez l'éditeur de script via `Extensions > Apps Script`.
3. Copiez le contenu de `CalculPortions.gs` dans l'éditeur.
4. Actualisez votre page Google Sheets. Un nouveau menu personnalisé **🍎 Menu Diététique** apparaîtra.
5. Cliquez sur **1. Générer le Dashboard interactif** pour initialiser l'interface.
6. Ajustez les valeurs patient (Poids, Cible, Macros) et observez le moteur recalculer les assiettes !
7. Cliquez sur **2. Exporter le Bilan Patient (PDF)** pour générer le rapport.

## 📄 Structure du Code

- `onOpen()` : Initialisation du menu personnalisé.
- `creerModeleFeuille()` : Déploiement de l'interface et du tableau de bord.
- `recalculerMenu()` : Cœur de l'algorithme "Solver" qui équilibre les équivalences macro-nutritionnelles de manière itérative.
- `exporterPDF()` : Injection des données patient dans un template HTML, conversion en PDF et envoi de l'email automatique.
- `creerFeuilleSuivi()` : Génération du tracking à 20 semaines et instanciation du `LineChart`.

## 📜 Licence

Ce projet est conçu pour un usage professionnel et éducatif.
