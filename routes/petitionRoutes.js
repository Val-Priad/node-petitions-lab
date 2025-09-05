const express = require('express');
const petitionControllers = require('./../controllers/petitionControllers');

const router = express.Router();


router.route(["/","/api/petitions"])
    .get(petitionControllers.getPetitions)

router.route("/api/petition-creation")
    .get(petitionControllers.getPetitionCreationPage)
    .post(petitionControllers.petitionCreation);


module.exports = router