const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const {
  getErrorMessage,
  updateServerErrorResponse,
} = require("../services/error");
const { imagePublish } = require("../services/image");
const { sendMessage, isValidRecipient } = require("../services/mail");

//Models
const User = require("../models/User");

//Initialize
const router = express.Router();

//Common functions
const getUserData = (user) => {
  //2020-10-30-Bug add check null image or not with a good file (bad path)
  const avatar = {};
  if (user.account.avatar) {
    avatar.secure_url = user.account.avatar.secure_url;
  }
  return {
    _id: user._id,
    token: user.token,
    account: {
      username: user.account.username,
      phone: user.account.phone,
      avatar,
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
        //2020-10-30-Bug add check null image or not with a good file (bad path)
        if (image && image.path && image.size > 0) {
          const result = await imagePublish(
            image.path,
            `/vinted/users/${newUser._id}`,
            "mainImage"
          );
          newUser.account.avatar = result;
        }

        // Save user
        await newUser.save();

        // Send an email for user fecilitation
        if (isValidRecipient(newUser.email)) {
          return sendMessage(
            res,
            getUserData(newUser),
            getErrorMessage("Email cannot be send"),
            "Compte d'accès",
            `Bonjour ${newUser.account.username}, \n \n \n Félicitation, \n \n votre compte a bien été créé. \n \n Nous vous souhaitons une bonne navigation via notre application. \n \n Cordialement. \n \n L'équipe service.`,
            newUser.email
          );
        }

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

router.post("/user/initialize", async (req, res) => {
  try {
    const { email } = req.fields;
    const defautPassword = uid2(8);
    const user = await User.findOne({ email });
    if (user) {
      const newHash = getHash(user.salt, defautPassword);
      user.hash = newHash;

      // Save user
      await user.save();

      // Send an email for indicated changes and new password (must be temporary)
      if (isValidRecipient(user.email)) {
        return sendMessage(
          res,
          getUserData(user),
          getErrorMessage("Email cannot be send"),
          "Compte d'accès",
          `Bonjour ${user.account.username}, \n \n \n Votre mot de passe a été réinitialisé avec la valeur suivante : ${defautPassword}. \n \n Vous devez vous connecter pour changer ce mot de passe temporaire. \n \n Cordialement. \n \n L'équipe service.`,
          user.email
        );
      }

      res.status(200).json(getUserData(user));
    } else {
      res.status(400).json(getErrorMessage("Email is unknow"));
    }
  } catch (error) {
    updateServerErrorResponse(res, error);
  }
});

//Export
module.exports = router;
