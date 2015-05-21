
module.exports = {
    "url": { type: String, required: true, unique: true }

  , "sessions": { type: Number }
  , "avgSessionDuration": { type: Number }
  , "bouncerate": { type: Number }

  , "fetched_at": { type: Date, default: Date.now }
  , "updated_at": { type: Date, default: Date.now }
  , "created_at": { type: Date, default: Date.now }
};
