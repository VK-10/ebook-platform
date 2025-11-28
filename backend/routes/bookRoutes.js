const express  = require("express");
const router = express.Router();
const {
    createBook,
    getBooks,
    getBookById,
    updateBook,
    deleteBook,
    updateBookCover,
} = require("../controller/bookController");

const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// right after your requires
console.log('DEBUG controllers types:', {
  createBook: typeof createBook,
  getBooks: typeof getBooks,
  getBookById: typeof getBookById,
  updateBook: typeof updateBook,
  deleteBook: typeof deleteBook,
  updateBookCover: typeof updateBookCover,
});
console.log('DEBUG protect type:', typeof protect);
console.log('DEBUG upload type:', typeof upload);


router.use(protect);

router.route("/").post(createBook).get(getBooks);
router.route("/:id").get(getBookById).put(updateBook).delete(deleteBook);
router.route("/cover/:id").put(upload, updateBookCover);

module.exports = router;