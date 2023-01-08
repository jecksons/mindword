const authController = require('../controllers/auth-controller')
const controller = require('../controllers/draft-controller');

module.exports = (app, handleRequestDB) => {
   app.get('/drafts', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.getAllReq));
   app.post('/drafts', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.saveReq));
   app.delete('/drafts/:id', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.deleteReq));
}

