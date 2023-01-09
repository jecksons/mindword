const controller = require('../controllers/draft-controller'),
   connFactory = require('../services/connection-db'),
   dotenv = require('dotenv');

dotenv.config({
   path: '../.env'
});

const config = require('../config');
const { ErBadRequest, ErNotFound } = require('../services/error_classes');

const id_user_demo = 1;


test('Fail on adding an expression without description.', async () => {
   expect.assertions(1);
   let conn = connFactory.getConnection(config);
   let exprData = {
      example: 'Sword'
   };
   try {
      exprData = await controller.save(exprData, id_user_demo, conn);
   } catch (err) {
      expect(err).toBeInstanceOf(ErBadRequest);
   }
});


test('Add a new incomplete expression, and deleting it.', async () => {
   expect.assertions(4);
   let conn = connFactory.getConnection(config);
   let draftData = {
      description: 'Sword'
   };
   draftData = await controller.save(draftData, id_user_demo, conn);
   const savedId = draftData.id;
   expect(savedId).toBeGreaterThan(0);
   conn = connFactory.getConnection(config);
   draftData = await controller.getById(savedId, id_user_demo, conn);
   expect(draftData).toBeDefined();
   expect(draftData.description).toStrictEqual('Sword');
   conn = connFactory.getConnection(config);
   await controller.remove(savedId, id_user_demo, conn);
   conn = connFactory.getConnection(config);
   try {
      exprData = await controller.getById(savedId, id_user_demo, conn);
   } catch (err) {
      expect(err).toBeInstanceOf(ErNotFound);
   }

});



