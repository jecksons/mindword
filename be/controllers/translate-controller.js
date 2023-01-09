const { ErBadRequest } = require("../services/error_classes");
const UtilsLib = require("../services/utils_lib");
const { TranslationServiceClient } = require("@google-cloud/translate").v3;
const config = require("../config");
const { existsSync } = require("fs");


class TranslateController {

   static async get(expression) {
      if (!expression) {
         throw new ErBadRequest('No expression received!');
      }
      if (!existsSync(config.googleTranslateAuthFile)) {
         throw new Error('The file does not exist!');
      }
      const translate = new TranslationServiceClient({
         keyFilename: config.googleTranslateAuthFile,
         projectId: config.googleProjectId
      });
      let [translation] = await translate.translateText({
         contents: [expression],
         parent: config.googleTranslateParent,
         targetLanguageCode: 'pt'
      });
      translation = Array.isArray(translation) ? translation : [translation];
      return {
         translatedText: translation.length ? translation[0].translations.map(itm => itm.translatedText) : [],
         expression
      }
   }

   static getReq(req, res) {
      TranslateController.get(req.query.text)
         .then((ret) => res.status(200).json(ret))
         .catch((err) => UtilsLib.resError(err, res));
   }

}

module.exports = TranslateController;