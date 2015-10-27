
module.exports = {
    "name": { type: String, required: true }
  , "email": { type: String, required: true, unique: true }
  , "email_sent_at": { type: Date }
  , "created_at": { type: Date, default: Date.now }
};
