const express = require('express');
const petitionControllers = require('./../controllers/petitionControllers');

const router = express.Router();


router.route(["/","/api/petitions"])
    .get(petitionControllers.getPetitions)


module.exports = router