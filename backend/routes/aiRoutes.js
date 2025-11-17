const express = require("express");
const router = express.Router();

const {
    generateOutline,
    generateChapterContent,
} = require("../controller/aiController")