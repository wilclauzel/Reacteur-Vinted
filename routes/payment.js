const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  getErrorMessage,
  updateServerErrorResponse,
} = require("../services/error");

//Models
const User = require("../models/User");
const Offer = require("../models/Offer");
const Payment = require("../models/Payment");
const { isValidObjectId } = require("mongoose");

//Initialize
const router = express.Router();

//Routes
router.post("/payment", async (req, res) => {
  try {
    if (req.fields) {
      const {
        label,
        quantity,
        price,
        deliveryCost,
        insuranceCost,
        amount,
        currency,
        offerId,
        stripeToken,
      } = req.fields;
      if (isValidObjectId(offerId)) {
        const offer = await Offer.findById(offerId).select(
          "product_name product_description product_price"
        );
        if (offer) {
          // Debits payment
          const stripeResponse = await stripe.charges.create({
            amount: amount * 100,
            currency: currency,
            description: label,
            source: stripeToken,
          });

          if (stripeResponse.status === "succeeded") {
            // Create payment
            const payment = new Payment({
              label,
              quantity,
              price,
              delivery_cost: deliveryCost,
              insurance_cost: insuranceCost,
              amount,
              currency,
              offer: offerId,
            });

            // Save payment
            await payment.save();

            // Response
            const result = {
              offerId: offerId,
              quantity: quantity,
              paidAmount: amount,
              currency: currency,
              checkedData: stripeResponse.payment_method_details.card.last4,
            };

            res.status(200).json(result);
          } else {
            res
              .status(400)
              .json(
                getErrorMessage(
                  `The payment has been rejected with the followed message : ${stripeResponse.failure_message}`
                )
              );
          }
        } else {
          res.status(400).json(getErrorMessage("Offer not exists"));
        }
      } else {
        res.status(400).json(getErrorMessage("Invalid id parameter"));
      }
    } else {
      res.status(400).json(getErrorMessage("Missing mandatory parameter"));
    }
  } catch (error) {
    updateServerErrorResponse(res, error);
  }
});

module.exports = router;
