
/*
 * Body Parsers functions for each Network
 * output:
 * {
 *   total: Number  // total count for network interaction
 *   detail: Object // network specific counts
 * }
 *
 */

module.exports = {

  facebook: function( body ) {

    if (body.length === 0){
      return { total: 0 };
    }

    body = body[0];

    return {
      total: body.total_count,
      details: {
        shares: body.share_count,
        likes: body.like_count,
        comments: body.comment_count,
        clicks: body.click_count
      }
    };
  },

  linkedin: function( body ) {
    return {
      total: (body && body.count) || 0
    };
  },

  twitter: function( body ) {
    return {
      total: (body && body.count) || 0
    };
  },

  googleplus: function( body ) {
    if (body.length === 0){
      return { total: 0 };
    }

    body = body[0];

    return {
      total: (body && body.result && body.result.metadata
        && body.result.metadata.globalCounts.count) || 0
    };
  },

};