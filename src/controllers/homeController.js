var controllerHelper = require('../core/controllerHelpers'),
    fs = require('fs'),
    path = require('path'),
    q = require('q'),
    AreaTypes = require('../core/game/areaTypes'),
    ImageSource = require('../core/game/imageSource'),
    AssetFiles = require('../core/game/assetFiles');


var AreaModel = {};
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
    AreaModel[areaProp] = {
        desc :areaTypeInfo.desc,
        isWalkable:areaTypeInfo.isWalkable,
        srcWidth: imageSource.width,
        srcHeight: imageSource.height,
        srcTop: imageSource.top,
        srcUrl: imageFile
    };

    if(bgSource)
    {
        AreaModel[areaProp].bgHeight = bgSource.height;
        AreaModel[areaProp].bgWidth = bgSource.width;
        AreaModel[areaProp].bgTop = bgSource.top;
    }
}

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
                    controllerHelper.renderView('home/index', model, req, resp);
                }, function(reason){
                    next(reason);
                });
        }
    }
};