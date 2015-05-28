
module.exports = {
    "url": { type: String, required: true, unique: true }

  , "tail": { type: String }
  , "title": { type: String }
  , "text": { type: String }
  , "comments": { type: Number, default: 0 }
  , "published_at": { type: Date, default: Date.now }

  , "fetched_at": { type: Date, default: Date.now }
  , "updated_at": { type: Date, default: Date.now }
  , "created_at": { type: Date, default: Date.now }
};
