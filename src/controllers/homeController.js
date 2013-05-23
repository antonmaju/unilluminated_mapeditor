var controllerHelper = require('../core/controllerHelpers'),
    fs = require('fs'),
    path = require('path'),
    q = require('q'),
    CommonUtils = require('../core/commonUtils'),
    AreaTypes = require('../core/game/areaTypes'),
    ImageSource = require('../core/game/imageSource'),
    AssetFiles = require('../core/game/assetFiles'),
    Filters = require('../core/game/filters');

var exitArea =27;

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

function positionExists(arr,row, col){
    for(var i=0; i<arr.length; i++){
        if(arr[i].row == row && arr[i].column == col)
            return true;
    }
    return false;
}

function populateExitArea(map, arr,row, col){
    var grid= map.grid;
    if(grid[row][col] != exitArea) return;

    arr.push({row: row, column: col});

    if(row > 0 && !positionExists(arr,row-1,col))
        populateExitArea(map, arr, row-1,col);

    if(row < map.row -1  && !positionExists(arr,row+1,col))
        populateExitArea(map, arr, row+1, col);

    if(col > 0 && !positionExists(arr, row, col-1))
        populateExitArea(map, arr, row, col-1);

    if(col < map.column - 1 && !positionExists(arr,row,col+1))
        populateExitArea(map,arr, row, col+1);
}

function populateExits(map){
    map.exits ={};
    var lArr =[], rArr=[], tArr =[], bArr=[];

    //populate left
    for(var i=1; i<map.row-1; i++)
    {
        if(map.grid[i][0] == exitArea)
        {
            populateExitArea(map, lArr,i,0);
            break;
        }
    }

    //populate top
    for(var i=1; i<map.column-1; i++)
    {
        if(map.grid[0][i] == exitArea)
        {

            populateExitArea(map,tArr, 0,i);
            break;
        }
    }

    //populate right
    for(var i=1; i<map.row-1; i++)
    {
        if(map.grid[i][map.column-1] == exitArea)
        {
            populateExitArea(map,rArr, i,map.column-1);
            break;
        }
    }

    //populate bottom
    for(var i=1; i<map.column-1; i++)
    {
        if(map.grid[0][i] == exitArea)
        {
            populateExitArea(map,bArr, map.row-1,i);
            break;
        }
    }

    if(lArr.length > 0) map.exits.L = lArr;
    if(tArr.length > 0) map.exits.T = tArr;
    if(rArr.length > 0) map.exits.R = rArr;
    if(bArr.length > 0) map.exits.B = bArr;

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
            var map = req.body.params;

            function validateMap(map, errors){
                var reId = /^[A-Za-z0-9]+$/;

                if(!map.id || !reId.test(map.id))
                    errors.push({prop:'id', message:'Id is invalid'});

                if(! CommonUtils.isInteger(map.row) || map.row <10 || map.row >90)
                    errors.push({prop:'row', message:'Row is invalid'});

                if(! CommonUtils.isInteger(map.column) || map.column < 10 || map.column > 90)
                    errors.push({prop:'column', message: 'Column is invalid'});

                if(! map.grid)
                {
                    errors.push({prop: 'grid', message: 'Grid is invalid'});
                }
                else
                {
                    var mapIssue = false;

                    if(map.grid.length != map.row )
                    {
                        errors.push({prop:'row', message:'Total grid row is different'});
                        mapIssue = true;
                    }

                    if(map.grid[0].length != map.column)
                    {
                        errors.push({prop:'column', message: 'Total grid column is different' });
                        mapIssue = true;
                    }

                    if(! mapIssue)
                    {
                        populateExits(map);

                        if(map.exits.L == undefined && map.exits.T == undefined && map.exits.R == undefined &&
                            map.exits.B == undefined)
                        {
                            errors.push({prop:'grid', message:'Map should have exits'});
                        }
                        else
                        {
                            delete map.row;
                            delete map.column;
                            delete map.isExisting;
                        }
                    }
                }

                return errors.length == 0;
            }

            var errors =[];

            if(! validateMap(map, errors))
            {
                resp.json({success:false, errors: errors});
                return;
            }

            var mapPath =  path.join(path.dirname(process.mainModule.filename),'core/game/maps',
                map.id.toLowerCase()+'.js');


            var newContent = 'module.exports = \r\n'+JSON.stringify(map,null,4) +';';
            var writeFile = q.defer();

            fs.writeFile(mapPath, newContent, function(err){
                (err) ?  writeFile.reject(err) : writeFile.resolve();
            });

            writeFile.promise
                .then(function(){
                    resp.json({success:true});
                }, function(reason){
                    resp.json({success:false, errors:[{prop:'', msg:reason.toString()}]})
                });
        }
    },
    mapDelete:{
        route :'/maps/delete/:id',
        method:'post',
        handler: function(req, resp, next){
            var fileName=req.params.id.toLowerCase();
            var mapPath =  path.join(path.dirname(process.mainModule.filename),'core/game/maps',
                fileName+'.js');


            delete require.cache[mapPath];
            fs.unlink(mapPath, function(err){
                if(err)
                {

                    next(err);
                }
                else
                    resp.json({success:true});
            });
        }
    }
};