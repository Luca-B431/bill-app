// Importation des modules nécessaires
import store from "./Store.js"; // Importation du module Store pour la gestion des données via l'API
import Login, { PREVIOUS_LOCATION } from "../containers/Login.js"; // Importation du composant Login et de la constante PREVIOUS_LOCATION
import Bills from "../containers/Bills.js"; // Importation du composant Bills pour gérer les factures
import NewBill from "../containers/NewBill.js"; // Importation du composant NewBill pour créer une nouvelle facture
import Dashboard from "../containers/Dashboard.js"; // Importation du composant Dashboard pour afficher le tableau de bord

import BillsUI from "../views/BillsUI.js"; // Importation de l'interface utilisateur des factures
import DashboardUI from "../views/DashboardUI.js"; // Importation de l'interface utilisateur du tableau de bord

import { ROUTES, ROUTES_PATH } from "../constants/routes.js"; // Importation des constantes des routes de l'application

// Fonction principale d'initialisation de l'application
export default () => {
  const rootDiv = document.getElementById("root"); // Récupère l'élément HTML ayant l'ID 'root' pour y injecter les pages
  rootDiv.innerHTML = ROUTES({ pathname: window.location.pathname }); // Charge l'interface utilisateur en fonction de l'URL actuelle

  // Fonction de navigation entre les différentes pages
  window.onNavigate = (pathname) => {
    window.history.pushState({}, pathname, window.location.origin + pathname); // Met à jour l'URL sans recharger la page (navigation SPA)

    // Si l'utilisateur navigue vers la page Login
    if (pathname === ROUTES_PATH["Login"]) {
      rootDiv.innerHTML = ROUTES({ pathname }); // Charge l'interface utilisateur pour la page Login
      document.body.style.backgroundColor = "#0E5AE5"; // Change le fond de la page en bleu
      new Login({
        document,
        localStorage,
        onNavigate,
        PREVIOUS_LOCATION,
        store,
      }); // Crée une nouvelle instance du composant Login avec les propriétés nécessaires
    } else if (pathname === ROUTES_PATH["Bills"]) {
      // Si l'utilisateur navigue vers la page des factures
      rootDiv.innerHTML = ROUTES({ pathname, loading: true }); // Affiche un écran de chargement

      // Gestion des icônes actives dans la barre latérale
      const divIcon1 = document.getElementById("layout-icon1"); // Récupère l'élément de l'icône 1
      const divIcon2 = document.getElementById("layout-icon2"); // Récupère l'élément de l'icône 2
      divIcon1.classList.add("active-icon"); // Ajoute la classe 'active-icon' à l'icône 1
      divIcon2.classList.remove("active-icon"); // Retire la classe 'active-icon' de l'icône 2

      const bills = new Bills({ document, onNavigate, store, localStorage }); // Crée une nouvelle instance du composant Bills

      // Récupère les factures
      bills
        .getBills()
        .then((data) => {
          rootDiv.innerHTML = BillsUI({ data }); // Affiche la liste des factures via l'interface BillsUI
          new Bills({ document, onNavigate, store, localStorage }); // Crée une nouvelle instance de Bills après l'affichage des factures
        })
        .catch((error) => {
          rootDiv.innerHTML = ROUTES({ pathname, error }); // Gère les erreurs en affichant une page d'erreur
        });
    } else if (pathname === ROUTES_PATH["NewBill"]) {
      // Si l'utilisateur navigue vers la page de création d'une nouvelle facture
      rootDiv.innerHTML = ROUTES({ pathname, loading: true }); // Affiche un écran de chargement
      new NewBill({ document, onNavigate, store, localStorage }); // Crée une nouvelle instance du composant NewBill

      // Gestion des icônes actives
      const divIcon1 = document.getElementById("layout-icon1"); // Récupère l'élément de l'icône 1
      const divIcon2 = document.getElementById("layout-icon2"); // Récupère l'élément de l'icône 2
      divIcon1.classList.remove("active-icon"); // Retire la classe 'active-icon' de l'icône 1
      divIcon2.classList.add("active-icon"); // Ajoute la classe 'active-icon' à l'icône 2
    } else if (pathname === ROUTES_PATH["Dashboard"]) {
      // Si l'utilisateur navigue vers le tableau de bord
      rootDiv.innerHTML = ROUTES({ pathname, loading: true }); // Affiche un écran de chargement

      const bills = new Dashboard({
        document,
        onNavigate,
        store,
        bills: [],
        localStorage,
      }); // Crée une nouvelle instance du composant Dashboard

      // Récupère toutes les factures pour afficher le tableau de bord
      bills
        .getBillsAllUsers()
        .then((bills) => {
          rootDiv.innerHTML = DashboardUI({ data: { bills } }); // Affiche l'interface du tableau de bord avec les factures
          new Dashboard({ document, onNavigate, store, bills, localStorage }); // Crée une nouvelle instance de Dashboard après l'affichage
        })
        .catch((error) => {
          rootDiv.innerHTML = ROUTES({ pathname, error }); // Gère les erreurs en affichant une page d'erreur
        });
    }
  };

  // Gestion des retours en arrière dans l'historique du navigateur
  window.onpopstate = (e) => {
    const user = JSON.parse(localStorage.getItem("user")); // Récupère l'utilisateur actuel depuis le localStorage

    // Si l'utilisateur est sur la page d'accueil sans être connecté
    if (window.location.pathname === "/" && !user) {
      document.body.style.backgroundColor = "#0E5AE5"; // Change le fond en bleu
      rootDiv.innerHTML = ROUTES({ pathname: window.location.pathname }); // Recharge l'interface de la page d'accueil
    }
    // Si un utilisateur est connecté, revient à la page précédente
    else if (user) {
      onNavigate(PREVIOUS_LOCATION); // Navigue vers la dernière page visitée
    }
  };

  // Gestion de l'affichage au chargement initial de la page
  if (window.location.pathname === "/" && window.location.hash === "") {
    // Si l'utilisateur est sur la page d'accueil
    new Login({ document, localStorage, onNavigate, PREVIOUS_LOCATION, store }); // Crée une nouvelle instance de Login
    document.body.style.backgroundColor = "#0E5AE5"; // Change le fond en bleu
  } else if (window.location.hash !== "") {
    // Si un hash est présent dans l'URL (page spécifique)

    if (window.location.hash === ROUTES_PATH["Bills"]) {
      // Si l'utilisateur est sur la page des factures
      rootDiv.innerHTML = ROUTES({
        pathname: window.location.hash,
        loading: true,
      }); // Affiche un écran de chargement

      // Gestion des icônes actives
      const divIcon2 = document.getElementById("layout-icon2"); // Récupère l'élément de l'icône 2
      divIcon2.classList.remove("active-icon"); // Retire la classe 'active-icon' de l'icône 2

      const bills = new Bills({ document, onNavigate, store, localStorage }); // Crée une nouvelle instance du composant Bills

      // Récupère les factures
      bills
        .getBills()
        .then((data) => {
          rootDiv.innerHTML = BillsUI({ data }); // Affiche la liste des factures
          new Bills({ document, onNavigate, store, localStorage }); // Crée une nouvelle instance de Bills après l'affichage des factures
        })
        .catch((error) => {
          rootDiv.innerHTML = ROUTES({ pathname: window.location.hash, error }); // Gère les erreurs en affichant une page d'erreur
        });
    } else if (window.location.hash === ROUTES_PATH["NewBill"]) {
      // Si l'utilisateur est sur la page de création d'une nouvelle facture

      rootDiv.innerHTML = ROUTES({
        pathname: window.location.hash,
        loading: true,
      }); // Affiche un écran de chargement
      new NewBill({ document, onNavigate, store, localStorage }); // Crée une nouvelle instance du composant NewBill

      // Gestion des icônes actives
      const divIcon1 = document.getElementById("layout-icon1"); // Récupère l'élément de l'icône 1
      const divIcon2 = document.getElementById("layout-icon2"); // Récupère l'élément de l'icône 2
      divIcon1.classList.remove("active-icon"); // Retire la classe 'active-icon' de l'icône 1
      divIcon2.classList.add("active-icon"); // Ajoute la classe 'active-icon' à l'icône 2
    } else if (window.location.hash === ROUTES_PATH["Dashboard"]) {
      // Si l'utilisateur est sur le tableau de bord
      rootDiv.innerHTML = ROUTES({
        pathname: window.location.hash,
        loading: true,
      }); // Affiche un écran de chargement

      const bills = new Dashboard({
        document,
        onNavigate,
        store,
        bills: [],
        localStorage,
      }); // Crée une nouvelle instance du composant Dashboard

      // Récupère toutes les factures pour afficher le tableau de bord
      bills
        .getBillsAllUsers()
        .then((bills) => {
          rootDiv.innerHTML = DashboardUI({ data: { bills } }); // Affiche l'interface du tableau de bord avec les factures
          new Dashboard({ document, onNavigate, store, bills, localStorage }); // Crée une nouvelle instance de Dashboard après l'affichage
        })
        .catch((error) => {
          rootDiv.innerHTML = ROUTES({ pathname: window.location.hash, error }); // Gère les erreurs en affichant une page d'erreur
        });
    }
  }

  return null; // La fonction ne retourne rien directement, elle modifie uniquement le DOM
};
