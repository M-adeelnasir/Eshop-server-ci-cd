const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const PaymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    cartId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    transaction: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      required: true,
    },
    authorization: JSON,
    shippingAddress: JSON,
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;
