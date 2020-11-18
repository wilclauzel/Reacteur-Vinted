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
    if (req.fields && req.files.picture1) {
      const image1Path = req.files.picture1.path;
      const image2Path = req.files.picture2 ? req.files.picture2.path : "";
      const image3Path = req.files.picture3 ? req.files.picture3.path : "";
      const image4Path = req.files.picture4 ? req.files.picture4.path : "";
      const image5Path = req.files.picture5 ? req.files.picture5.path : "";

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
          product_pictures: [],
          owner: user,
          created_date: new Date(),
        });

        //Save image
        const result = await imagePublish(
          image1Path,
          `/vinted/offers/${newOffer._id}`,
          "mainImage"
        );
        newOffer.product_image = result;
        newOffer.product_pictures.push(result);
        if (image2Path) {
          const result2 = await imagePublish(
            image2Path,
            `/vinted/offers/${newOffer._id}`,
            "image2"
          );
          newOffer.product_pictures.push(result2);
        }
        if (image3Path) {
          const result3 = await imagePublish(
            image3Path,
            `/vinted/offers/${newOffer._id}`,
            "image3"
          );
          newOffer.product_pictures.push(result3);
        }
        if (image4Path) {
          const result4 = await imagePublish(
            image4Path,
            `/vinted/offers/${newOffer._id}`,
            "image4"
          );
          newOffer.product_pictures.push(result4);
        }
        if (image5Path) {
          const result5 = await imagePublish(
            image5Path,
            `/vinted/offers/${newOffer._id}`,
            "image5"
          );
          newOffer.product_pictures.push(result5);
        }

        // Save Offer
        await newOffer.save();

        // Response
        const {
          owner,
          product_image,
          product_pictures,
          ...rest
        } = newOffer._doc;
        let avatar = {};
        if (owner.account.avatar) {
          avatar = { secure_url: owner.account.avatar.secure_url };
        }
        rest.owner = {
          _id: owner._id,
          email: owner.email,
          account: {
            username: owner.account.username,
            phone: owner.account.phone,
            avatar: avatar,
          },
        };
        // Return only the path to get image
        rest.product_image = { secure_url: product_image.secure_url };
        const pictures = [];
        for (let i = 0; i < product_pictures.length; i++) {
          pictures.push({ secure_url: product_pictures[i].secure_url });
        }
        rest.product_pictures = pictures;

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
      // pageSize,
      limit,
      startDate,
      endDate,
    } = req.query;
    const pageSize = limit;

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
          "product_name product_description product_details product_price product_image.secure_url product_image.original_filename product_pictures created_date"
        )
        .populate(
          "owner",
          "email account.username account.phone account.avatar.secure_url account.avatar.original_filename"
        );

      if (offer) {
        // Response
        const { product_pictures, ...rest } = offer._doc;
        const pictures = [];
        for (let i = 0; i < product_pictures.length; i++) {
          pictures.push({
            secure_url: product_pictures[i].secure_url,
            original_filename: product_pictures[i].original_filename,
          });
        }
        rest.product_pictures = pictures;
        res.status(200).json(rest);
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
