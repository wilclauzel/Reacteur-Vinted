const SERVER_ERROR = "Server had a problem";

const getErrorMessage = (message, error) => {
  if (error) {
    console.log(error.message);
  }
  return { error: { message } };
};

const updateServerErrorResponse = (res, error, message) => {
  if (error) {
    console.log(error.message);
  }
  if (!message) {
    message = SERVER_ERROR;
  }
  return res.status(500).json({ error: { message } });
};

module.exports = { SERVER_ERROR, getErrorMessage, updateServerErrorResponse };
