var htmlHelpers = require('./htmlHelpers');

/**
 * Wraps model passed with additional information
 * @param {Object} model
 * @param {Object} req
 */

exports.buildModel = buildModel = function(model, req){
    var locals = { model: model};
    locals.req = req;
    locals.html = htmlHelpers;
    locals.errors = req.errors || [];
    return locals;
};

/**
 * Renders model to view
 * @param {string} view
 * @param {object} model
 * @param {object} req
 * @param resp
 */
exports.renderView = function(view, model, req, resp){
    var locals = buildModel(model, req);
    resp.render(view, locals);
};