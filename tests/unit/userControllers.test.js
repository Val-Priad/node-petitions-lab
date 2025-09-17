const { userRegistration, userLogin, checkAuth, getLogOut } = require("../../controllers/userControllers");
const { Author, sequelize } = require("../../models");

jest.mock("../../models", () => ({
    Author: {
        findOne: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
    },
    sequelize: {
        transaction: jest.fn(),
    },
}));

describe("User Controllers", () => {
    let req, res, t;

    beforeEach(() => {
        req = {
            body: {},
            session: {},
            xhr: false,
            headers: { accept: "application/json" },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
            redirect: jest.fn(),
            render: jest.fn(),
        };
        t = {
            commit: jest.fn(),
            rollback: jest.fn(),
        };
        sequelize.transaction.mockResolvedValue(t);
        jest.clearAllMocks();
    });

    describe("userRegistration", () => {
        it("should return 400 if passwords do not match", async () => {
            req.body = { username: "test", password: "123", confirmPassword: "456" };

            await userRegistration(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Паролі не співпадають!",
            });
        });

        it("should return 400 if user already exists", async () => {
            req.body = { username: "test", password: "123", confirmPassword: "123" };
            Author.findOne.mockResolvedValue({ id: 1 });

            await userRegistration(req, res);

            expect(t.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Користувач вже існує!",
            });
        });

        it("should create new user if valid", async () => {
            req.body = { username: "test", password: "123", confirmPassword: "123" };
            Author.findOne.mockResolvedValue(null);
            Author.create.mockResolvedValue({ id: 2, username: "test" });

            await userRegistration(req, res);

            expect(t.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Реєстрація успішна!",
                user: { id: 2, username: "test" },
            });
        });
    });

    describe("userLogin", () => {
        it("should login successfully and set session", async () => {
            req.body = { username: "test", password: "123" };
            Author.findOne.mockResolvedValue({ id: 1, username: "test", password: "123" });

            await userLogin(req, res);

            expect(req.session.user).toEqual({ id: 1, username: "test", password: "123" });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                redirectUrl: "/api/my-petitions",
            });
        });

        it("should return 401 if login fails", async () => {
            req.body = { username: "wrong", password: "wrong" };
            Author.findOne.mockResolvedValue(null);

            await userLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Невірний логін або пароль",
            });
        });
    });

    describe("checkAuth", () => {
        it("should return authenticated user", async () => {
            req.session.user = { id: 1 };
            Author.findByPk.mockResolvedValue({ id: 1, username: "test", is_admin: true });

            await checkAuth(req, res);

            expect(res.json).toHaveBeenCalledWith({
                isAuthenticated: true,
                username: "test",
                isAdmin: true,
            });
        });

        it("should return not authenticated if no session", async () => {
            await checkAuth(req, res);

            expect(res.json).toHaveBeenCalledWith({ isAuthenticated: false });
        });
    });

    describe("getLogOut", () => {
        it("should destroy session and redirect to login", () => {
            req = {
                session: {
                    destroy: jest.fn((cb) => cb(null))
                },
                xhr: false,
                headers: { accept: "text/html" }
            };

            getLogOut(req, res);

            expect(res.redirect).toHaveBeenCalledWith("/login");        });

        it("should handle error during logout", () => {
            req.session.destroy = jest.fn((cb) => cb(new Error("fail")));

            getLogOut(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Помилка при виході",
            });
        });
    });
});
