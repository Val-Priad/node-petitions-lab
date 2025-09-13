const express = require('express');
const userControllers = require('./../controllers/userControllers');

const router = express.Router();

router.route("/register")
    .get(userControllers.getRegister)
    .post(userControllers.userRegistration)

router.route("/login")
    .get(userControllers.getloginPage)
    .post(userControllers.userLogin)

module.exports = router