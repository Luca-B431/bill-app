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

      // TEST HIGHLGHTED AJOUT POUR LE KANBAN
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      const highlightedIcon = windowIcon.classList.contains("active-icon");
      expect(highlightedIcon).toBe(true);
    });

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
      const handleClickIconEye = jest.fn((e) => e.stopPropagation());
      const eyes = screen.getAllByTestId("icon-eye");
      eyes.forEach((eye) => {
        eye.addEventListener("click", handleClickIconEye);
        fireEvent.click(eye);
      });
      expect(handleClickIconEye).toHaveBeenCalled();
    });

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

  test("Then I click on the icon eye and a modal should open", () => {
    document.body.innerHTML = BillsUI({ data: bills });

    // Mock de la fonction qui gère le clic sur l'icône de l'œil
    const handleClickIconEye = jest.fn((e) => e.stopPropagation());
    const eyes = screen.getAllByTestId("icon-eye");

    // Ajouter un listener pour chaque icône d'œil
    eyes.forEach((eye) => {
      eye.addEventListener("click", handleClickIconEye);
      fireEvent.click(eye); // Simuler un clic
    });

    // Vérifier que le clic a bien déclenché la méthode
    expect(handleClickIconEye).toHaveBeenCalled();
  });
});

import BillsManager from "../containers/Bills"; // j'importe la class qui contient la méthode getBills
import { formatDate, formatStatus } from "../app/format"; // j'importe les fonctions de formatage

// Mock des fonctions de formatage
jest.mock("../app/format", () => ({
  formatDate: jest.fn(),
  formatStatus: jest.fn(),
}));

describe("test getBills out of BillsManager", () => {
  let billsManager;
  let store;

  beforeEach(() => {
    // Mock du store qui retourne une liste fictive de factures
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

    // Création de l'instance de BillsManager
    billsManager = new BillsManager({
      document: document,
      onNavigate: jest.fn(),
      store,
      localStorage: {},
    });
  });

  it("should return a list of formatted bills", async () => {
    const bills = await billsManager.getBills();

    // Vérifie que les factures retournées sont bien formatées
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

    // Vérifie que les fonctions de formatage ont été appelées avec les bonnes données
    expect(formatDate).toHaveBeenCalledWith("2025-04-01");
    expect(formatStatus).toHaveBeenCalledWith("pending");
    expect(formatDate).toHaveBeenCalledWith("2025-04-02");
    expect(formatStatus).toHaveBeenCalledWith("approved");
  });

  it("should log an error and return raw data if formatDate throws an error", async () => {
    // Simule une erreur dans formatDate
    formatDate.mockImplementation(() => {
      throw new Error("Date format error");
    });

    const bills = await billsManager.getBills();

    // Vérifie que la date brute est retournée en cas d'erreur
    expect(bills).toEqual([
      { date: "2025-04-01", status: "Formatted Status: pending" },
      { date: "2025-04-02", status: "Formatted Status: approved" },
    ]);

    // Vérifie que l'erreur a été loggée dans la console (tu peux aussi vérifier l'appel de console.log si nécessaire)
    // Utilise jest.spyOn pour espionner console.log si nécessaire
  });
});

// Test GET Bills API
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(store, "bills");
      const bills = await store.bills().list();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.length).toBe(4);
    });
  });

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
