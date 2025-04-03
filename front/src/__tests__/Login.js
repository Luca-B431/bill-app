/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router";

jest.mock("../app/store", () => mockStore);

describe("Given I am a user on login page", () => {
  describe("When I do not fill fields and I click on employee button Login In", () => {
    test("Then It should render Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("employee-email-input");
      expect(inputEmailUser.value).toBe("");

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      expect(inputPasswordUser.value).toBe("");

      const form = screen.getByTestId("form-employee");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-employee")).toBeTruthy();
    });
  });

  describe("When I fill fields in correct format and click on employee button Login In", () => {
    test("Then I should be identified as an Employee in app", async () => {
      document.body.innerHTML = LoginUI();

      const inputData = {
        email: "johndoe@email.com",
        password: "azerty",
      };

      const inputEmailUser = screen.getByTestId("employee-email-input");
      fireEvent.change(inputEmailUser, { target: { value: inputData.email } });
      expect(inputEmailUser.value).toBe(inputData.email);

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      fireEvent.change(inputPasswordUser, {
        target: { value: inputData.password },
      });
      expect(inputPasswordUser.value).toBe(inputData.password);

      const form = screen.getByTestId("form-employee");

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const storeMock = {
        login: jest.fn(() => Promise.resolve({ jwt: "fake-jwt-token" })),
      };

      const loginInstance = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store: storeMock,
      });

      const handleSubmit = jest.fn(loginInstance.handleSubmitEmployee);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      await waitFor(() => expect(storeMock.login).toHaveBeenCalled());
      expect(storeMock.login).toHaveBeenCalledWith(
        '{"email":"johndoe@email.com","password":"azerty"}'
      );
    });
  });

  describe("When I fill fields in correct format and click on admin button Login In", () => {
    test("Then I should be identified as an Admin in app", async () => {
      document.body.innerHTML = LoginUI(); // Ensure the DOM is rendered

      const inputData = {
        email: "admin@email.com",
        password: "admin123",
      };

      const inputEmailAdmin = screen.getByTestId("admin-email-input");
      fireEvent.change(inputEmailAdmin, { target: { value: inputData.email } });
      expect(inputEmailAdmin.value).toBe(inputData.email);

      const inputPasswordAdmin = screen.getByTestId("admin-password-input");
      fireEvent.change(inputPasswordAdmin, {
        target: { value: inputData.password },
      });
      expect(inputPasswordAdmin.value).toBe(inputData.password);

      const form = screen.getByTestId("form-admin");

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const storeMock = {
        login: jest.fn(() => Promise.resolve({ jwt: "fake-jwt-token" })),
      };

      const loginInstance = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store: storeMock,
      });

      const handleSubmit = jest.fn(loginInstance.handleSubmitAdmin);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      await waitFor(() => expect(storeMock.login).toHaveBeenCalled());
      expect(storeMock.login).toHaveBeenCalledWith(
        '{"email":"admin@email.com","password":"admin123"}'
      );
    });
  });

  describe("When I call the createUser method", () => {
    test("Then it should create a new user and log them in", async () => {
      document.body.innerHTML = LoginUI(); // Ensure the DOM is rendered

      const createMock = jest.fn(() => Promise.resolve());
      const storeMock = {
        users: jest.fn(() => ({
          create: createMock,
        })),
        login: jest.fn(() => Promise.resolve({ jwt: "fake-jwt-token" })),
      };

      const onNavigate = jest.fn();
      const loginInstance = new Login({
        document,
        localStorage: localStorageMock,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store: storeMock,
      });

      const user = {
        type: "Employee",
        email: "newuser@email.com",
        password: "password123",
      };

      await loginInstance.createUser(user);

      expect(storeMock.users).toHaveBeenCalled(); // Ensure users() is called
      expect(createMock).toHaveBeenCalledWith({
        data: JSON.stringify({
          type: user.type,
          name: user.email.split("@")[0],
          email: user.email,
          password: user.password,
        }),
      });
      expect(storeMock.login).toHaveBeenCalledWith(
        JSON.stringify({
          email: user.email,
          password: user.password,
        })
      );
    });
  });
});
