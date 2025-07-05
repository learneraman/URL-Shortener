const moongoose = require("mongoose");
const schema = new moongoose.Schema(
  {
    shortId: {
      type: String,
      unique: true,
      required: true,
    },
    originalUrl: {
      type: String,
      required: true,
    },
    visitHistory: [{ timestamp: { type: Date } }],
  },
  { timestamps: true }
);
const Url = moongoose.model("Url", schema);
module.exports = Url;

// In summary, this schema defines a field called visitHistory that is an array of objects, where each object has a single property called timestamp that stores a date and time value.
// {Ttimestamps: true} set, which means that Mongoose will add createdAt and updatedAt fields to the schema.The createdAt and updatedAt fields are stored in the database as Date objects, and can be accessed like any other field in the document.