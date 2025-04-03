/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
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

      // TEST HIGHLGHTED
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
        expect(eye.getAttribute("data-bill-url")).toBe();
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
});
