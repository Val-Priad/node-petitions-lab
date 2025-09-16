const {
    petitionCreation,
} = require("../../controllers/petitionControllers");

const { Petition, sequelize } = require("../../models");

// Мокаем транзакции и модель
jest.mock("../../models", () => ({
    Petition: {
        create: jest.fn(),
    },
    sequelize: {
        transaction: jest.fn(),
    },
}));

describe("petitionControllers", () => {
    let req, res, t;

    beforeEach(() => {
        // мок запроса и ответа
        req = {
            body: { title: "Test petition", text: "Some text" },
            session: { user: { id: 1 } },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // мок транзакции
        t = { commit: jest.fn(), rollback: jest.fn() };
        sequelize.transaction.mockResolvedValue(t);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should create a petition successfully", async () => {
        Petition.create.mockResolvedValue({
            id: 10,
            title: "Test petition",
            text: "Some text",
            petition_current: 0,
            creation_date: new Date("2025-09-15"),
            expiry_date: new Date("2025-10-15"),
            status: "In_Progress",
        });

        await petitionCreation(req, res);

        expect(Petition.create).toHaveBeenCalled();
        expect(t.commit).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "success",
                data: expect.any(Object),
            })
        );
    });

    it("should return 401 if user is not logged in", async () => {
        req.session = null;

        await petitionCreation(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: "Авторизуйтеся для створення петиції",
        });
    });

    it("should return 400 if fields are missing", async () => {
        req.body = { title: "" };

        await petitionCreation(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Необхідно заповнити всі поля",
        });
    });

    it("should rollback transaction on error", async () => {
        Petition.create.mockRejectedValue(new Error("DB error"));

        await petitionCreation(req, res);

        expect(t.rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ status: "fail" })
        );
    });
});
