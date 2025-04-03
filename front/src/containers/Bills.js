import { ROUTES_PATH } from "../constants/routes.js";
import { formatDate, formatStatus } from "../app/format.js";
import Logout from "./Logout.js";

// Icon click et newBill click management
export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const buttonNewBill = document.querySelector(
      `button[data-testid="btn-new-bill"]`
    );
    if (buttonNewBill)
      buttonNewBill.addEventListener("click", this.handleClickNewBill);
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
    if (iconEye)
      iconEye.forEach((icon) => {
        icon.addEventListener("click", () => this.handleClickIconEye(icon));
      });
    new Logout({ document, localStorage, onNavigate });
  }

  // Fonction pour gérer le clic sur le bouton "Nouvelle facture"
  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH["NewBill"]);
  };

  // Fonction pour gérer le clic sur l'icône de l'œil
  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url");
    const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
    $("#modaleFile")
      .find(".modal-body")
      .html(
        `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
      );
    $("#modaleFile").modal("show");
  };

  // OK, fonctionnel, tableau des bills avec data, map list
  getBills = () => {
    // Vérifie si l'objet `store` est défini
    if (this.store) {
      return this.store
        .bills() // Appelle la méthode `bills()` pour récupérer les factures
        .list() // Récupère la liste des factures sous forme de promesse
        .then((snapshot) => {
          // `snapshot` est un tableau d'objets représentant les factures
          const bills = snapshot.map((doc) => {
            try {
              return {
                ...doc, // Copie toutes les propriétés de `doc`
                date: formatDate(doc.date), // Formate la date
                status: formatStatus(doc.status), // Formate le statut
              };
            } catch (e) {
              // Gestion des erreurs si `formatDate` échoue (ex. : données corrompues)
              console.log(e, "for", doc); // Affiche l'erreur et la facture concernée
              return {
                ...doc,
                date: doc.date, // Garde la date brute en cas d'erreur
                status: formatStatus(doc.status), // Continue à formater le statut
              };
            }
          });
          console.log("length", bills.length); // Affiche le nombre de factures traitées
          return bills; // Retourne le tableau des factures formatées
        });
    }
  };
}
