const authController = require('../controllers/auth-controller')
const controller = require('../controllers/translate-controller');

module.exports = (app) => {
   app.get('/translate', [authController.verifyClientVersion], (req, res) => controller.getReq(req, res));

}

