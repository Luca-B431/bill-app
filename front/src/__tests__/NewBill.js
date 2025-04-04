/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => JSON.stringify({ email: "employee@test.com" })),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock console.error
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    test("Then the file input should accept only image files", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);

      const validFile = new File(["image"], "image.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("image.png");

      const invalidFile = new File(["text"], "text.txt", {
        type: "text/plain",
      });
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        "Veuillez télécharger une image JPG ou PNG."
      );
    });

    test("Then submitting the form should call updateBill", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe("When I submit a new bill", () => {
    test("Then it should send a POST request to the API and navigate to Bills page", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId("form-new-bill");

      // Mock form inputs
      screen.getByTestId("expense-type").value = "Transports";
      screen.getByTestId("expense-name").value = "Train ticket";
      screen.getByTestId("datepicker").value = "2023-10-01";
      screen.getByTestId("amount").value = "100";
      screen.getByTestId("vat").value = "20";
      screen.getByTestId("pct").value = "20";
      screen.getByTestId("commentary").value = "Business trip";
      newBill.fileUrl = "https://example.com/file.png";
      newBill.fileName = "file.png";

      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(mockStore.bills().update).toHaveBeenCalledWith({
        data: JSON.stringify({
          email: "employee@test.com",
          type: "Transports",
          name: "Train ticket",
          amount: 100,
          date: "2023-10-01",
          vat: "20",
          pct: 20,
          commentary: "Business trip",
          fileUrl: "https://example.com/file.png",
          fileName: "file.png",
          status: "pending",
        }),
        selector: newBill.billId,
      });
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
  });
});
