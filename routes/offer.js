const express = require("express");
const {
  getErrorMessage,
  updateServerErrorResponse,
} = require("../services/error");
const {
  imagePublish,
  imageDelete,
  imageFolderDelete,
} = require("../services/image");

//Models
const User = require("../models/User");
const Offer = require("../models/Offer");
const { isValidObjectId } = require("mongoose");

//Initialize
const router = express.Router();

//Routes
// Example d'appel par méthode de isAuthenticated , mais non utilisé ici (appel global)
// router.post("/offer/publish", isAuthenticated, async (req, res) => {
router.post("/offer/publish", async (req, res) => {
  try {
    if (req.fields && req.files.picture) {
      const imagePath = req.files.picture.path;
      const {
        title,
        description,
        price,
        condition,
        city,
        brand,
        size,
        color,
      } = req.fields;

      const user = req.authenticateUser;

      if (user) {
        //Create Offer
        const newOffer = new Offer({
          product_name: title,
          product_description: description,
          product_price: price,
          product_details: [
            { MARQUE: brand },
            { TAILLE: size },
            { ÉTAT: condition },
            { COULEUR: color },
            { EMPLACEMENT: city },
          ],
          owner: user,
          created_date: new Date(),
        });

        //Save image
        const result = await imagePublish(
          imagePath,
          `/vinted/offers/${newOffer._id}`,
          "mainImage"
        );
        newOffer.product_image = result;

        // Save Offer
        await newOffer.save();

        // Response
        const { product_image, ...rest } = newOffer._doc;
        // Return only the path to get image
        rest.product_image = { secure_url: product_image.secure_url };
        res.status(200).json(rest);
      } else {
        res.status(400).json(getErrorMessage("Missing user"));
      }
    } else {
      res.status(400).json(getErrorMessage("Missing mandatory parameter"));
    }
  } catch (error) {
    updateServerErrorResponse(res, error);
  }
});

router.put("/offer/publish", async (req, res) => {
  try {
    if (req.fields && req.files.picture) {
      const imagePath = req.files.picture.path;
      const {
        id,
        title,
        description,
        price,
        condition,
        city,
        brand,
        size,
        color,
      } = req.fields;

      const user = req.authenticateUser;

      if (user) {
        //Load Offer
        const offer = await Offer.findById(id);

        if (offer && offer.owner.equals(user._id)) {
          //Save image
          const result = await imagePublish(
            imagePath,
            `/vinted/offers/${offer._id}`,
            "mainImage"
          );
          offer.product_image = result;

          //Update Offer
          offer.product_name = title ? title : offer.product_name;
          offer.product_description = description
            ? description
            : offer.product_description;
          offer.product_price = price ? price : offer.product_price;
          offer.product_details = [
            { MARQUE: brand },
            { TAILLE: size },
            { ÉTAT: condition },
            { COULEUR: color },
            { EMPLACEMENT: city },
          ];
          await offer.save();

          // Response
          const { product_image, ...rest } = offer._doc;
          // Return only the path to get image
          rest.product_image = { secure_url: product_image.secure_url };
          res.status(200).json(rest);
        } else {
          res.status(400).json(getErrorMessage("Offer not exists"));
        }
      } else {
        res.status(400).json(getErrorMessage("Missing user"));
      }
    } else {
      res.status(400).json(getErrorMessage("Missing mandatory parameter"));
    }
  } catch (error) {
    updateServerErrorResponse(res, error);
  }
});

router.delete("/offer/publish", async (req, res) => {
  try {
    if (req.fields) {
      const id = req.fields.id;
      const user = req.authenticateUser;

      if (user) {
        //Load Offer
        const offer = await Offer.findById(id);

        if (offer && offer.owner.equals(user._id)) {
          //Delete image
          if (offer.product_image) {
            const result = await imageDelete(offer.product_image.public_id);
            const res = await imageFolderDelete(`/vinted/offers/${offer._id}`);
          }

          //Delete Offer
          await offer.deleteOne();

          // Response
          res.status(200).json({ message: "Offer deleted" });
        } else {
          res.status(400).json(getErrorMessage("Offer not exists"));
        }
      } else {
        res.status(400).json(getErrorMessage("Missing user"));
      }
    } else {
      res.status(400).json(getErrorMessage("Missing mandatory parameter"));
    }
  } catch (error) {
    updateServerErrorResponse(res, error);
  }
});

router.get("/offers", async (req, res) => {
  try {
    const {
      title,
      priceMin,
      priceMax,
      sort,
      page,
      pageSize,
      startDate,
      endDate,
    } = req.query;
    //const pageSize = 2;

    //Get filters
    let filters = {};
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMin || priceMax) {
      const minMaxPriceFilter = {};
      if (priceMin) {
        minMaxPriceFilter.$gte = priceMin;
      }
      if (priceMax) {
        minMaxPriceFilter.$lte = priceMax;
      }
      filters.product_price = minMaxPriceFilter;
    }
    if (startDate || endDate) {
      const startEndDateFilter = {};
      if (startDate) {
        startEndDateFilter.$gte = startDate;
      }
      if (endDate) {
        startEndDateFilter.$lte = endDate;
      }
      filters.created_date = startEndDateFilter;
    }

    //Get sorters
    let sorters = {};
    if (sort === "price-desc" || sort === "price-asc") {
      sorters.product_price = sort === "price-asc" ? 1 : -1;
    }

    //Pagination
    let size = 2; //Default size
    if (
      pageSize &&
      Number.isInteger(parseInt(pageSize)) &&
      parseInt(pageSize) >= 1
    ) {
      size = parseInt(pageSize);
    }
    let start = 0;
    if (page && Number.isInteger(parseInt(page)) && parseInt(page) > 1) {
      start = (parseInt(page) - 1) * size;
    }
    const count = await Offer.countDocuments(filters);
    const pagesNumber = Math.ceil(count / size);

    //Get offers as requested
    const offers = await Offer.find(filters)
      .select(
        "product_name product_description product_details product_price product_image.secure_url created_date"
      )
      .populate(
        "owner",
        "email account.username account.phone account.avatar.secure_url account.avatar.original_filename"
      )
      .sort(sorters)
      .limit(size)
      .skip(start);

    res.status(200).json({
      count,
      pagesNumber,
      offers,
    });
  } catch (error) {
    updateServerErrorResponse(res, error);
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (isValidObjectId(id)) {
      const offer = await Offer.findById(id)
        .select(
          "product_name product_description product_details product_price product_image.secure_url product_image.original_filename created_date"
        )
        .populate(
          "owner",
          "email account.username account.phone account.avatar.secure_url account.avatar.original_filename"
        );
      if (offer) {
        res.status(200).json(offer);
      } else {
        res.status(400).json(getErrorMessage("Offer not exists"));
      }
    } else {
      res.status(400).json(getErrorMessage("Invalid parameter"));
    }
  } catch (error) {
    updateServerErrorResponse(res, error);
  }
});

module.exports = router;
