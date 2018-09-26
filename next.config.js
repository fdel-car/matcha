const withSass = require('@zeit/next-sass');
module.exports = withSass({
  publicRuntimeConfig: {
    ip_info_access_token: process.env.IP_INFO_ACCESS_TOKEN,
    google_maps_access_token: process.env.GOOGLE_MAPS_ACCESS_TOKEN
  }
});
