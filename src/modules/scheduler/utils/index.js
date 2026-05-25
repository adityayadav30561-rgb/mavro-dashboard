const tokens = require('./tokens');
const timezone = require('./timezone');
const tenantGuard = require('./tenantGuard');
const encryption = require('./encryption');
const oauthState = require('./oauthState');
const slotHash = require('./slotHash');
const ics = require('./ics');

module.exports = {
  ...tokens,
  ...timezone,
  ...tenantGuard,
  ...encryption,
  ...oauthState,
  ...slotHash,
  ...ics,
  encryption,
  oauthState,
  timezone,
  slotHash,
  ics,
};
