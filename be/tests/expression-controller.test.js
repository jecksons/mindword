const controller = require('../controllers/expression-controller'),
   connFactory = require('../services/connection-db'),
   dotenv = require('dotenv');

dotenv.config({
   path: '../.env'
});

const config = require('../config');
const { ErBadRequest, ErNotFound, ErUnprocEntity } = require('../services/error_classes');
const UtilsLib = require('../services/utils_lib');

const id_user_demo = 1;

test('Fail to get an unexisting expression.', async () => {
   expect.assertions(1);
   let conn = connFactory.getConnection(config);
   try {
      await controller.getById(9999999, id_user_demo, conn);
   } catch (err) {
      expect(err).toBeInstanceOf(ErNotFound);
   }
});

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
   expect.assertions(3);
   let conn = connFactory.getConnection(config);
   let exprData = {
      description: 'Sword'
   };
   exprData = await controller.save(exprData, id_user_demo, conn);
   exprData = exprData.data;
   const savedId = exprData.id;
   expect(savedId).toBeGreaterThan(0);
   conn = connFactory.getConnection(config);
   exprData = await controller.getById(savedId, id_user_demo, conn);
   expect(exprData.valid).toBe(false);
   conn = connFactory.getConnection(config);
   await controller.remove(savedId, id_user_demo, conn);
   conn = connFactory.getConnection(config);
   try {
      exprData = await controller.getById(savedId, id_user_demo, conn);
   } catch (err) {
      expect(err).toBeInstanceOf(ErNotFound);
   }
});


test('Add a new complete expression, and deleting it.', async () => {
   expect.assertions(3);
   let conn = connFactory.getConnection(config);
   let exprData = {
      description: 'Sword',
      meaning: 'Espada',
      example_phrase: 'I forgot my sword yesterday'
   };
   exprData = await controller.save(exprData, id_user_demo, conn);
   exprData = exprData.data;
   const savedId = exprData.id;
   expect(savedId).toBeGreaterThan(0);
   conn = connFactory.getConnection(config);
   exprData = await controller.getById(savedId, id_user_demo, conn);
   expect(exprData.valid).toBe(true);
   conn = connFactory.getConnection(config);
   await controller.remove(savedId, id_user_demo, conn);
   conn = connFactory.getConnection(config);
   try {
      exprData = await controller.getById(savedId, id_user_demo, conn);
   } catch (err) {
      expect(err).toBeInstanceOf(ErNotFound);
   }
});



test('Add a new incomplete expression, and updating it with complete info.', async () => {
   expect.assertions(4);
   let conn = connFactory.getConnection(config);
   let exprData = {
      description: 'Sword'
   };
   exprData = await controller.save(exprData, id_user_demo, conn);
   exprData = exprData.data;
   const savedId = exprData.id;
   expect(savedId).toBeGreaterThan(0);
   conn = connFactory.getConnection(config);
   exprData = await controller.getById(savedId, id_user_demo, conn);
   expect(exprData.valid).toBe(false);
   exprData.meaning = 'Espada';
   exprData.example_phrase = 'I forgot my sword yesterday';
   conn = connFactory.getConnection(config);
   exprData = await controller.save(exprData, id_user_demo, conn);
   exprData = exprData.data;
   expect(exprData.valid).toBe(true);
   conn = connFactory.getConnection(config);
   await controller.remove(savedId, id_user_demo, conn);
   conn = connFactory.getConnection(config);
   try {
      exprData = await controller.getById(savedId, id_user_demo, conn);
   } catch (err) {
      expect(err).toBeInstanceOf(ErNotFound);
   }
});

