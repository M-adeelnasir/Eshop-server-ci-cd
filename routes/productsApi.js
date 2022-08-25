const express = require("express");
const router = express.Router();
const auth = require("../middleware/authorization");
const { check, validationResult } = require("express-validator");
const { Storage } = require("@google-cloud/storage");
let multer = require("multer");
const Product = require("../models/Product");
const memoryStorage = multer.memoryStorage;
const storage = new Storage({
  projectId: process.env.PROJECT_ID | "778djsdbhjsdbh",
  keyFilename: process.env.GCLOUD_KEY_FILE | "sdkjskdjko9",
});
const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET | "sdjksjdkiu");

multer = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: 2000 * 1024 * 1024,
  },
});

router.post(
  "/",
  [
    auth,
    [
      check("name", "Name is Required").not().isEmpty(),
      check("description", "Description is Required").not().isEmpty(),
      check("category", "Category is Required").not().isEmpty(),
      check("price", "Price is Required").not().isEmpty(),
      check("quantity", "Quantity is Required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, description, category, price, brand, quantity } = req.body;
      const newProduct = new Product({
        userId: req.user.id,
        name,
        description,
        category,
        price,
        brand,
        quantity,
      });
      const product = await newProduct.save();
      res.json({ product });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

//get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(400).json({ msg: "Product was not found" });
    }
    res.json(product);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

router.get("/instructors/:id", auth, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.params.id });
    res.json(products);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

router.post(
  "/upload/thumbnail",
  auth,
  multer.single("file"),
  async (req, res) => {
    try {
      const { id } = req.user;
      const { productId, multiple } = req.query;
      if (!req.file) {
        res.status(400).send("No file uploaded.");
        return;
      }
      const blob = bucket.file(`${id}/${productId}/${req.file.originalname}`);
      const blobStream = blob.createWriteStream();
      blobStream.on("error", (err) => {
        console.log(err);
      });

      blobStream.on("finish", async () => {
        console.log(`sucessfully uploaded ${req.file.originalname}`);
        await blob.makePublic();
        if (multiple) {
          await Product.findOneAndUpdate(
            { _id: productId },
            { $push: { images: blob.metadata.mediaLink } },
            { new: true, upsert: true }
          );
        } else {
          await Product.findByIdAndUpdate(
            { _id: productId },
            { $set: { thumbnail: blob.metadata.mediaLink } },
            { new: true }
          );
        }

        res
          .status(200)
          .send({ msg: `sucessfully uploaded ${req.file.originalname}` });
      });

      blobStream.end(req.file.buffer);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
