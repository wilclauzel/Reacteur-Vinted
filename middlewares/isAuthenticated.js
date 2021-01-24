const {
  getErrorMessage,
  updateServerErrorResponse,
} = require("../services/error");

//Models
const User = require("../models/User");

const URL_POST_WITHOUT_TOKEN_AUTHENTICATION = [
  "/user/signup",
  "/user/login",
  "/user/initialize",
];

const isAuthenticated = async (req, res, next) => {
  try {
    if (
      req.method === "GET" ||
      (req.method === "POST" &&
        URL_POST_WITHOUT_TOKEN_AUTHENTICATION.includes(req.url))
    ) {
      return next();
    } else {
      if (req.headers.authorization) {
        const token = req.headers.authorization.replace("Bearer ", "");
        if (token) {
          // Get user without authetication properties
          const user = await User.findOne({ token }).select(
            "email account isValidated"
          );
          if (user) {
            req.authenticateUser = user;
            return next();
          } else {
            return res.status(401).json(getErrorMessage("Unauthorized"));
          }
        } else {
          return res.status(401).json(getErrorMessage("Unauthorized"));
        }
      } else {
        return res.status(401).json(getErrorMessage("Unauthorized"));
      }
    }
  } catch (error) {
    updateServerErrorResponse(res, error);
  }
};

module.exports = isAuthenticated;
