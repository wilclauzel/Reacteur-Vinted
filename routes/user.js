const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const {
  getErrorMessage,
  updateServerErrorResponse,
} = require("../services/error");
const { imagePublish } = require("../services/image");

//Models
const User = require("../models/User");

//Initialize
const router = express.Router();

//Common functions
const getUserData = (user) => {
  return {
    _id: user._id,
    token: user.token,
    account: {
      username: user.account.username,
      phone: user.account.phone,
      avatar: {
        secure_url: user.account.avatar.secure_url,
      },
    },
  };
};

const getHash = (salt, password) => {
  return SHA256(password + salt).toString(encBase64);
};

//Routes
router.post("/user/signup", async (req, res) => {
  try {
    const { email, username, phone, password } = req.fields;
    const image = req.files.picture;

    if (email && username && password) {
      const user = await User.findOne({ email });
      if (!user) {
        //Get secure datas
        const token = uid2(64);
        const salt = uid2(64);
        const hash = getHash(salt, password);

        //Create user
        const newUser = new User({
          email,
          account: {
            username,
            phone,
          },
          salt,
          hash,
          token,
        });

        //save image
        if (image.path) {
          const result = await imagePublish(
            image.path,
            `/vinted/users/${newUser._id}`,
            "mainImage"
          );
          newUser.account.avatar = result;
        }

        // Save user
        await newUser.save();
        res.status(200).json(getUserData(newUser));
      } else {
        res.status(409).json(getErrorMessage("Email is already used"));
      }
    } else {
      res.status(400).json(getErrorMessage("Missing mandatory parameter"));
    }
  } catch (error) {
    updateServerErrorResponse(res, error);
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.fields;
    const user = await User.findOne({ email });
    if (user) {
      const newHash = getHash(user.salt, password);
      if (newHash === user.hash) {
        res.status(200).json(getUserData(user));
      } else {
        res.status(401).json(getErrorMessage("User is not authorized"));
      }
    } else {
      res.status(400).json(getErrorMessage("Email is unknow"));
    }
  } catch (error) {
    updateServerErrorResponse(res, error);
  }
});

//Export
module.exports = router;
