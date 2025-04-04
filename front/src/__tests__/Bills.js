/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, waitFor, fireEvent } from "@testing-library/dom";
import store from "../__mocks__/store.js";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { ROUTES } from "../constants/routes.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { formatDate, formatStatus } from "../app/format";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      router();
      // OK
      window.onNavigate(ROUTES_PATH.Bills);

      // TEST
      // Vérification de la classe "active-icon" l'icône fenêtre
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      const highlightedIcon = windowIcon.classList.contains("active-icon");
      expect(highlightedIcon).toBe(true);
    });

    // Liste classé par ordre (TEST NON MODIFIE)
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : 0);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // TEST
    // Les icones possèdent un attribut data-bill-url qui contient l'URL du fichier correspondant
    test("Then icons should get the right URL", async () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      await waitFor(() => screen.getAllByTestId("icon-eye"));
      const eyes = screen.getAllByTestId("icon-eye");
      expect(eyes.length).toBe(4);

      eyes.forEach((eye, index) => {
        expect(eye.getAttribute("data-bill-url")).toBe(
          `${bills[index].fileUrl}`
        );
      });
    });

    test("Then I click on the icon eye and a modal should open", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = jest.fn();
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // mock modale testée, dans handleClickIconEye
      $.fn.modal = jest.fn();

      const eyes = screen.getAllByTestId("icon-eye");
      eyes.forEach((eye) => {
        const handleClickIconEye = jest.fn(() =>
          billsContainer.handleClickIconEye(eye)
        );
        eye.addEventListener("click", handleClickIconEye);
        fireEvent.click(eye);
        expect(handleClickIconEye).toHaveBeenCalled();
        expect($.fn.modal).toHaveBeenCalledWith("show");
      });
    });

    // TEST
    // Vérification que le clic sur le bouton "Nouvelle note de frais" redirige vers la page de création de note de frais
    test("then I click on the button new bill, I should be sent to new bill page", () => {
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill);
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      buttonNewBill.addEventListener("click", handleClickNewBill);
      fireEvent.click(buttonNewBill);
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
  });
});

// Mock des fonctions de formatage, import nécessaire pour Jest
jest.mock("../app/format", () => ({
  formatDate: jest.fn(),
  formatStatus: jest.fn(),
}));

describe("getBills method", () => {
  let billsManager;
  let store;

  // Setup de la méthode getBills
  beforeEach(() => {
    // Mock de l'instance de store
    store = {
      bills: jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue([
          { date: "2025-04-01", status: "pending" },
          { date: "2025-04-02", status: "approved" },
        ]),
      }),
    };

    // Mock des fonctions formatDate et formatStatus
    formatDate.mockImplementation((date) => `Formatted Date: ${date}`);
    formatStatus.mockImplementation((status) => `Formatted Status: ${status}`);

    // Création de l'instance
    billsManager = new Bills({
      document: document,
      onNavigate: jest.fn(),
      store,
      localStorage: {},
    });
  });

  it("should return a list of formatted bills", async () => {
    // On récupère la méthode GetBills de sa classe
    const bills = await billsManager.getBills();

    // TESTS
    expect(bills).toEqual([
      {
        date: "Formatted Date: 2025-04-01",
        status: "Formatted Status: pending",
      },
      {
        date: "Formatted Date: 2025-04-02",
        status: "Formatted Status: approved",
      },
    ]);

    expect(formatDate).toHaveBeenCalledWith("2025-04-01");
    expect(formatStatus).toHaveBeenCalledWith("pending");
    expect(formatDate).toHaveBeenCalledWith("2025-04-02");
    expect(formatStatus).toHaveBeenCalledWith("approved");
  });

  // Ici, on teste le comportement de la méthode getBills lorsque formatDate lève une erreur
  it("should log an error and return raw data if formatDate throws an error", async () => {
    formatDate.mockImplementation(() => {
      throw new Error("Date format error");
    });

    const bills = await billsManager.getBills();

    // Vérifie que la date brute est retournée en cas d'erreur
    expect(bills).toEqual([
      { date: "2025-04-01", status: "Formatted Status: pending" },
      { date: "2025-04-02", status: "Formatted Status: approved" },
    ]);
  });
});

// Test GET Bills API
// On va tester simplement que la méthode bills de l'objet store
// est appelée une fois et que la liste des factures est retournée avec succès
// et que la longueur de cette liste est de 4
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(store, "bills");
      const bills = await store.bills().list();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.length).toBe(4);
    });
  });

  // Messages d'erreurs API 404-500
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(store, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
    });

    // store.bills ne renvoit pas l'objet liste
    // on rentre l'erreur 404 et la 500 en paramètres sur BillsUI
    test("fetches bills from an API and fails with 404 message error", async () => {
      store.bills.mockImplementationOnce(() => ({
        list: () => Promise.reject(new Error("Erreur 404")),
      }));
      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      store.bills.mockImplementationOnce(() => ({
        list: () => Promise.reject(new Error("Erreur 500")),
      }));
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
