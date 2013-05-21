var controllerHelper = require('../core/controllerHelpers'),
    fs = require('fs'),
    path = require('path'),
    q = require('q'),
    AreaTypes = require('../core/game/areaTypes'),
    ImageSource = require('../core/game/imageSource'),
    AssetFiles = require('../core/game/assetFiles'),
    Filters = require('../core/game/filters');

/**
 * Populate area types with asset information
 * @return {Object}
 */
function populateAreaTypes(){
    var model = {};
    for(var areaProp in AreaTypes){
        var areaTypeInfo = AreaTypes[areaProp];
        if(! areaTypeInfo.srcKey) continue;
        var imageSource = ImageSource[areaTypeInfo.srcKey];
        var bgSource = null;

        if(areaTypeInfo.bgKey)
            bgSource = ImageSource[areaTypeInfo.bgKey];

        if(! imageSource) continue;

        var imageFile = null;

        for(var i=0; i<AssetFiles.length;i++){
            if(AssetFiles[i].key == imageSource.src){
                imageFile = AssetFiles[i].src;
            }
        }
        model[areaProp] = {
            id: areaProp,
            desc :areaTypeInfo.desc,
            isWalkable:areaTypeInfo.isWalkable,
            srcWidth: imageSource.width,
            srcHeight: imageSource.height,
            srcTop: imageSource.top,
            srcUrl: imageFile
        };

        if(bgSource)
        {
            model[areaProp].bgHeight = bgSource.height;
            model[areaProp].bgWidth = bgSource.width;
            model[areaProp].bgTop = bgSource.top;
        }
    };
    return model;
}

/**
 * Populate list of available filter
 * @return {Array}
 */
function populateFilters(){
    var filters = [];
    for(var prop in Filters)
    {
        filters.push(prop);
    }
    return filters;
}

var AreaModel = populateAreaTypes();
var filters = populateFilters();

module.exports ={
    index: {
        route: '/',
        method: 'get',
        handler: function(req, resp, next){
            var readFolder = q.defer();

            var mapFolder =  path.join(path.dirname(process.mainModule.filename),'core/game/maps');
            fs.readdir(mapFolder, function(err, files){
                if(err)
                    readFolder.reject(err);
                else
                    readFolder.resolve(files);
            });

            var model = {};

            readFolder.promise.
                then(function(files){
                    model.files = files;
                    model.areaTypes = AreaModel;
                    model.filters = filters;
                    controllerHelper.renderView('home/index', model, req, resp);
                }, function(reason){
                    next(reason);
                });
        }
    },
    map :{
        route:'/maps/:id',
        method: 'get',
        handler: function(req, resp, next){
            var id =req.params.id;

            if(! id)
            {
                resp.status(404).send('Not found');
                return;
            }

            try{
                delete require.cache[require.resolve('../core/game/maps/'+id+'.js')];
                resp.json(require('../core/game/maps/'+id));
            }
            catch (e)
            {
                next(e);
            }
        }
    },
    mapSave : {
        route :'/maps/:id',
        method:'post',
        handler: function(req, resp, next){
            console.log(req.body);
            next();
        }
    }
};