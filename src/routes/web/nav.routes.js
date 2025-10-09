const express = require("express");
const router = express.Router();
const { navController} = require("../../controller/web/nav.controller");

router.get("/", navController);

module.exports = router;