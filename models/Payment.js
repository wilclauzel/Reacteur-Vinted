const mongoose = require("mongoose");

const Payment = mongoose.model("Payment", {
  label: {
    type: String,
    maxlength: 500,
  },
  quantity: {
    type: Number,
    max: 100000,
  },
  price: {
    type: Number,
    max: 100000,
  },
  delivery_cost: {
    type: Number,
    max: 1000000,
  },
  insurance_cost: {
    type: Number,
    max: 1000000,
  },
  amount: {
    type: Number,
    max: 900000000,
  },
  currency: {
    type: String,
    maxlength: 3,
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
  },
  created_date: Date,
});

module.exports = Payment;
