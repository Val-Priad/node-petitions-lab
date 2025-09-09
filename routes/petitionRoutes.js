const express = require('express');
const petitionControllers = require('./../controllers/petitionControllers');

const router = express.Router();


router.route(["/","/api/petitions"])
    .get(petitionControllers.getPetitions)

router.route("/api/petition-creation")
    .get(petitionControllers.getPetitionCreationPage)
    .post(petitionControllers.petitionCreation);

router.route("/api/petition-overview/:id")
    .get(petitionControllers.getPetitionOverview)
    .patch(petitionControllers.petitionVoting)

router.route("/api/completed-petitions")
    .get(petitionControllers.getCompletedPetitions)

router.route("/api/my-petitions")
    .get(petitionControllers.getMyPetitions)

module.exports = router