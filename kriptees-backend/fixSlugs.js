require("dotenv").config({ path: "./config/config.env" }); // ✅ correct path
const mongoose = require("mongoose");
const slugify = require("slugify");
const Product = require("./model/ProductModel");
const connectDB = require("./db/connectDB");

(async () => {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    const products = await Product.find();

    for (let product of products) {
      if (!product.slug || product.slug === product._id.toString()) {
        product.slug = slugify(product.name, { lower: true, strict: true });
        await product.save();
        console.log(`🛠️ Slug updated: ${product.name} → ${product.slug}`);
      }
    }

    console.log("🎉 All slugs fixed!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.disconnect();
  }
})();
