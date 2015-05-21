
module.exports = {
    "url": { type: String, required: true, unique: true }

  , "tail": { type: String }
  , "title": { type: String }
  , "text": { type: String }

  , "fetched_at": { type: Date, default: Date.now }
  , "updated_at": { type: Date, default: Date.now }
  , "created_at": { type: Date, default: Date.now }
};
