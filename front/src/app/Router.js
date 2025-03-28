// Importation des modules nécessaires
import store from "./Store.js"; // Gestion des données via l'API
import Login, { PREVIOUS_LOCATION } from "../containers/Login.js"; // Composant Login
import Bills from "../containers/Bills.js"; // Composant pour la gestion des factures
import NewBill from "../containers/NewBill.js"; // Composant pour la création d'une facture
import Dashboard from "../containers/Dashboard.js"; // Composant du tableau de bord

import BillsUI from "../views/BillsUI.js"; // Interface utilisateur des factures
import DashboardUI from "../views/DashboardUI.js"; // Interface utilisateur du tableau de bord

import { ROUTES, ROUTES_PATH } from "../constants/routes.js"; // Routes de l'application

// Fonction principale d'initialisation de l'application
export default () => {
  const rootDiv = document.getElementById("root"); // Récupère l'élément HTML où injecter les pages
  rootDiv.innerHTML = ROUTES({ pathname: window.location.pathname }); // Charge l'interface correspondant à l'URL actuelle

  // Fonction de navigation entre les différentes pages
  window.onNavigate = (pathname) => {
    window.history.pushState({}, pathname, window.location.origin + pathname); // Change l'URL sans recharger la page

    if (pathname === ROUTES_PATH["Login"]) {
      rootDiv.innerHTML = ROUTES({ pathname }); // Affichage de la page Login
      document.body.style.backgroundColor = "#0E5AE5"; // Changement du fond en bleu
      new Login({
        document,
        localStorage,
        onNavigate,
        PREVIOUS_LOCATION,
        store,
      });
    } else if (pathname === ROUTES_PATH["Bills"]) {
      rootDiv.innerHTML = ROUTES({ pathname, loading: true }); // Affichage en mode "chargement"

      // Gestion des icônes actives dans la barre latérale
      const divIcon1 = document.getElementById("layout-icon1");
      const divIcon2 = document.getElementById("layout-icon2");
      divIcon1.classList.add("active-icon");
      divIcon2.classList.remove("active-icon");

      const bills = new Bills({ document, onNavigate, store, localStorage });

      // Récupération des factures
      bills
        .getBills()
        .then((data) => {
          rootDiv.innerHTML = BillsUI({ data }); // Affichage de la liste des factures
          new Bills({ document, onNavigate, store, localStorage }); // Réinitialisation du composant Bills
        })
        .catch((error) => {
          rootDiv.innerHTML = ROUTES({ pathname, error }); // Gestion des erreurs
        });
    } else if (pathname === ROUTES_PATH["NewBill"]) {
      rootDiv.innerHTML = ROUTES({ pathname, loading: true });
      new NewBill({ document, onNavigate, store, localStorage });

      // Gestion des icônes actives
      const divIcon1 = document.getElementById("layout-icon1");
      const divIcon2 = document.getElementById("layout-icon2");
      divIcon1.classList.remove("active-icon");
      divIcon2.classList.add("active-icon");
    } else if (pathname === ROUTES_PATH["Dashboard"]) {
      rootDiv.innerHTML = ROUTES({ pathname, loading: true });

      const bills = new Dashboard({
        document,
        onNavigate,
        store,
        bills: [],
        localStorage,
      });

      // Récupération de toutes les factures pour le tableau de bord
      bills
        .getBillsAllUsers()
        .then((bills) => {
          rootDiv.innerHTML = DashboardUI({ data: { bills } });
          new Dashboard({ document, onNavigate, store, bills, localStorage });
        })
        .catch((error) => {
          rootDiv.innerHTML = ROUTES({ pathname, error }); // Gestion des erreurs
        });
    }
  };

  // Gestion des retours en arrière dans l'historique du navigateur
  window.onpopstate = (e) => {
    const user = JSON.parse(localStorage.getItem("user"));

    // Si l'utilisateur est sur la page d'accueil sans être connecté
    if (window.location.pathname === "/" && !user) {
      document.body.style.backgroundColor = "#0E5AE5";
      rootDiv.innerHTML = ROUTES({ pathname: window.location.pathname });
    }
    // Si un utilisateur est connecté, revenir à la page précédente
    else if (user) {
      onNavigate(PREVIOUS_LOCATION);
    }
  };

  // Gestion de l'affichage au chargement initial de la page
  if (window.location.pathname === "/" && window.location.hash === "") {
    new Login({ document, localStorage, onNavigate, PREVIOUS_LOCATION, store });
    document.body.style.backgroundColor = "#0E5AE5";
  } else if (window.location.hash !== "") {
    if (window.location.hash === ROUTES_PATH["Bills"]) {
      rootDiv.innerHTML = ROUTES({
        pathname: window.location.hash,
        loading: true,
      });

      // Gestion des icônes actives
      const divIcon1 = document.getElementById("layout-icon1");
      const divIcon2 = document.getElementById("layout-icon2");
      divIcon1.classList.add("active-icon");
      divIcon2.classList.remove("active-icon");

      const bills = new Bills({ document, onNavigate, store, localStorage });

      // Récupération des factures
      bills
        .getBills()
        .then((data) => {
          rootDiv.innerHTML = BillsUI({ data });
          new Bills({ document, onNavigate, store, localStorage });
        })
        .catch((error) => {
          rootDiv.innerHTML = ROUTES({ pathname: window.location.hash, error });
        });
    } else if (window.location.hash === ROUTES_PATH["NewBill"]) {
      rootDiv.innerHTML = ROUTES({
        pathname: window.location.hash,
        loading: true,
      });
      new NewBill({ document, onNavigate, store, localStorage });

      // Gestion des icônes actives
      const divIcon1 = document.getElementById("layout-icon1");
      const divIcon2 = document.getElementById("layout-icon2");
      divIcon1.classList.remove("active-icon");
      divIcon2.classList.add("active-icon");
    } else if (window.location.hash === ROUTES_PATH["Dashboard"]) {
      rootDiv.innerHTML = ROUTES({
        pathname: window.location.hash,
        loading: true,
      });

      const bills = new Dashboard({
        document,
        onNavigate,
        store,
        bills: [],
        localStorage,
      });

      // Récupération des factures pour le tableau de bord
      bills
        .getBillsAllUsers()
        .then((bills) => {
          rootDiv.innerHTML = DashboardUI({ data: { bills } });
          new Dashboard({ document, onNavigate, store, bills, localStorage });
        })
        .catch((error) => {
          rootDiv.innerHTML = ROUTES({ pathname: window.location.hash, error });
        });
    }
  }

  return null; // La fonction ne retourne rien d'affiché directement
};
