const { SERVER_ERROR, getErrorResponse } = require("../services/error");

//Models
const User = require("../models/User");

const URL_POST_WITHOUT_TOKEN_AUTHENTICATION = ["/user/signup", "/user/login"];

const isAuthenticated = async (req, res, next) => {
  try {
    if (
      req.method === "POST" &&
      URL_POST_WITHOUT_TOKEN_AUTHENTICATION.includes(req.url)
    ) {
      return next();
    } else {
      if (req.headers.authorization) {
        const token = req.headers.authorization.replace("Bearer ", "");
        if (token) {
          // Get user without authetication properties
          const user = await User.findOne({ token }).select("email account");
          if (user) {
            req.authenticateUser = user;
            return next();
          } else {
            return res.status(401).json(getErrorResponse("Unauthorized"));
          }
        } else {
          return res.status(401).json(getErrorResponse("Unauthorized"));
        }
      } else {
        return res.status(401).json(getErrorResponse("Unauthorized"));
      }
    }
  } catch (error) {
    res.status(500).json(getErrorResponse(SERVER_ERROR, error));
  }
};

module.exports = isAuthenticated;
