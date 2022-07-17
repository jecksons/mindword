const authController = require('../controllers/auth-controller')
const controller = require('../controllers/expression-controller');

module.exports = (app, handleRequestDB) => {      
   app.get('/expressions/day-task/:day', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.getDayTaskReq));
   app.post('/expressions', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.saveReq));   
   app.delete('/expressions/id/:id', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.deleteReq));   
   app.get('/expressions/id/:id', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.getByIdReq));   
   app.post('/expressions/user-annotation', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.saveUserAnnotationReq));   
   app.post('/expressions/daily-goal', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.updateDailyGoalReq));   
   app.post('/expressions/fill-from-annotations', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.fillExpressionsFromAnnotationsReq));      
   app.get('/expressions/vocabulary', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.getVocabularyReq));
   app.get('/expressions/vocabulary-index', [authController.verifyClientVersion], (req, res) => handleRequestDB(req, res, controller.getVocabularyIndexReq));
   
}

