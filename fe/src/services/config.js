function Config() {
    const API_URL = process.env.REACT_APP_API_URL;
    const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const CLIENT_VERSION = process.env.REACT_APP_CLIENT_VERSION;
    const MAIN_PASSPHRASE = process.env.REACT_APP_MAIN_PASSPHRASE;

    let cfgBase = {
        apiURL: API_URL,
        googleClientId: GOOGLE_CLIENT_ID,
        clientVersion: CLIENT_VERSION,
        mainPassphrase: MAIN_PASSPHRASE
    };

    return cfgBase;
}

export default new Config();