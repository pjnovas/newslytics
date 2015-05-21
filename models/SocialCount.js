
module.exports = {
    "url": { type: String, required: true, unique: true }

  , "facebook": {
    count: Number,
    details: {
      shares: Number,
      likes: Number,
      comments: Number
    }
  }

  , "twitter": { count: Number }
  , "linkedin": { count: Number }
  , "googleplus": { count: Number }

  , "fetched_at": { type: Date, default: Date.now }
  , "updated_at": { type: Date, default: Date.now }
  , "created_at": { type: Date, default: Date.now }
};
