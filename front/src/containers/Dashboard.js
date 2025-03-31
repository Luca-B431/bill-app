import { formatDate } from "../app/format.js";
import DashboardFormUI from "../views/DashboardFormUI.js";
import BigBilledIcon from "../assets/svg/big_billed.js";
import { ROUTES_PATH } from "../constants/routes.js";
import USERS_TEST from "../constants/usersTest.js";
import Logout from "./Logout.js";

export const filteredBills = (data, status) => {
  return data && data.length
    ? data.filter((bill) => {
        let selectCondition;

        // in jest environment
        if (typeof jest !== "undefined") {
          selectCondition = bill.status === status;
        } else {
          /* istanbul ignore next */
          // in prod environment
          const userEmail = JSON.parse(localStorage.getItem("user")).email;
          selectCondition =
            bill.status === status &&
            ![...USERS_TEST, userEmail].includes(bill.email);
        }

        return selectCondition;
      })
    : [];
};

export const card = (bill) => {
  const firstAndLastNames = bill.email.split("@")[0];
  const firstName = firstAndLastNames.includes(".")
    ? firstAndLastNames.split(".")[0]
    : "";
  const lastName = firstAndLastNames.includes(".")
    ? firstAndLastNames.split(".")[1]
    : firstAndLastNames;

  return `
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${
    bill.id
  }'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `;
};

export const cards = (bills) => {
  return bills && bills.length ? bills.map((bill) => card(bill)).join("") : "";
};

export const getStatus = (index) => {
  switch (index) {
    case 1:
      return "pending";
    case 2:
      return "accepted";
    case 3:
      return "refused";
  }
};

export default class {
  constructor({ document, onNavigate, store, bills, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    $("#arrow-icon1").click((e) => this.handleShowTickets(e, bills, 1));
    $("#arrow-icon2").click((e) => this.handleShowTickets(e, bills, 2));
    $("#arrow-icon3").click((e) => this.handleShowTickets(e, bills, 3));
    new Logout({ localStorage, onNavigate });
  }

  handleClickIconEye = () => {
    const billUrl = $("#icon-eye-d").attr("data-bill-url");
    $("#modaleFileAdmin1")
      .find(".modal-body")
      .html(
        `<div style='text-align: center;'><img style= "width: 100%;" src=${billUrl} alt="Bill"/></div>`
      );
    if (typeof $("#modaleFileAdmin1").modal === "function")
      $("#modaleFileAdmin1").modal("show");
  };

  handleEditTicket(e, bill, bills) {
    if (this.counter === undefined || this.id !== bill.id) this.counter = 0;
    if (this.id === undefined || this.id !== bill.id) this.id = bill.id;
    if (this.counter % 2 === 0) {
      bills.forEach((b) => {
        $(`#open-bill${b.id}`).css({ background: "#0D5AE5" });
      });
      $(`#open-bill${bill.id}`).css({ background: "#2A2B35" });
      $(".dashboard-right-container div").html(DashboardFormUI(bill));
      $(".vertical-navbar").css({ height: "150vh" });
      this.counter++;
    } else {
      bills.forEach((b) => {
        $(`#open-bill${b.id}`).css({ background: "#0D5AE5" });
        $(`#open-bill${bill.id}`).css({ background: "#2A2B35" });

        $(".dashboard-right-container div").html(`
          <div id="big-billed-icon" data-testid="big-billed-icon">${BigBilledIcon}</div>
        `);
      });

      this.counter++;
    }

    $("#icon-eye-d").click(this.handleClickIconEye);
    $("#btn-accept-bill").click((e) => this.handleAcceptSubmit(e, bill));
    $("#btn-refuse-bill").click((e) => this.handleRefuseSubmit(e, bill));
  }

  handleAcceptSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: "accepted",
      commentAdmin: $("#commentary2").val(),
    };
    this.updateBill(newBill);
    this.onNavigate(ROUTES_PATH["Dashboard"]);
  };

  handleRefuseSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: "refused",
      commentAdmin: $("#commentary2").val(),
    };
    this.updateBill(newBill);
    this.onNavigate(ROUTES_PATH["Dashboard"]);
  };

  // SWITCH DE FONCTION SANS COMPTEUR, MEILLEURE GESTION DES CLICKS
  handleShowTickets(e, bills, index) {
    // Si 'this.toggles' n'est pas défini, on l'initialise comme un objet vide
    if (!this.toggles) this.toggles = {}; // Stocke l'état d'ouverture par index

    // On alterne l'état d'ouverture/fermeture (true/false) en fonction de l'index
    this.toggles[index] = !this.toggles[index]; // Toggle ouvert/fermé

    // Récupère l'élément HTML pour l'icône de flèche correspondant à cet index
    const arrowIcon = document.getElementById(`arrow-icon${index}`);
    // Récupère l'élément HTML qui contiendra le contenu des tickets
    const statusContainer = document.getElementById(
      `status-bills-container${index}`
    );

    // Si le toggle pour cet index est true (ouvert), on met à jour l'interface
    if (this.toggles[index]) {
      // La flèche est pointée vers le bas (0 degrés)
      arrowIcon.style.transform = "rotate(0deg)";
      // On remplace le contenu du conteneur par les cartes des tickets filtrés
      statusContainer.innerHTML = cards(filteredBills(bills, getStatus(index)));
    } else {
      // Si le toggle est false (fermé), on met la flèche à 90 degrés
      arrowIcon.style.transform = "rotate(90deg)";
      // On vide le contenu du conteneur
      statusContainer.innerHTML = "";
    }

    // Parcours tous les tickets (bills) pour ajouter un événement 'click' sur chaque bouton
    bills.forEach((bill) => {
      // On récupère le bouton qui ouvre le ticket (avec son ID unique)
      const btn = document.getElementById(`open-bill${bill.id}`);
      if (btn) {
        // On remplace l'élément par une nouvelle copie (pour supprimer les anciens écouteurs)
        btn.replaceWith(btn.cloneNode(true)); // Supprime les anciens écouteurs
        // Ajoute un nouvel écouteur d'événement sur le bouton pour gérer l'édition du ticket
        document
          .getElementById(`open-bill${bill.id}`)
          .addEventListener("click", (e) =>
            this.handleEditTicket(e, bill, bills)
          );
      }
    });

    // Retourne la liste des bills (tickets)
    return bills;
  }

  getBillsAllUsers = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then((snapshot) => {
          const bills = snapshot.map((doc) => ({
            id: doc.id,
            ...doc,
            date: doc.date,
            status: doc.status,
          }));
          return bills;
        })
        .catch((error) => {
          throw error;
        });
    }
  };

  // not need to cover this function by tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      return this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: bill.id })
        .then((bill) => bill)
        .catch(console.log);
    }
  };
}
