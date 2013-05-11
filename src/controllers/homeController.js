var controllerHelper = require('../core/controllerHelpers');


module.exports ={
    index: {
        route: '/',
        method: 'get',
        handler: function(req, resp, next){


            controllerHelper.renderView('home/index',{}, req, resp);
        }
    }
};