(function($, angular, window){

    var toolIconWidth = 32;
    var defaultAreaType = 1;
    var gridSize =32;

    /**
     * Initialize ul containing area types
     * @param bgImg
     */
    function initAreaCanvas(bgImg){

        $('.area').each(function(index, el){
            el.width=toolIconWidth;
            el.height=toolIconWidth;

            var srcTop = parseInt($(el).data('src-top'),10);
            var srcWidth = parseInt($(el).data('src-width'),10);
            var srcHeight = parseInt($(el).data('src-height'),10);

            var bgTop = parseInt($(el).data('bg-top'), 10);
            var bgWidth = parseInt($(el).data('bg-width'), 10);
            var bgHeight = parseInt($(el).data('bg-height'),10);

            var context = el.getContext('2d');
            context.clearRect(0,0,el.width, el.height);

            if(!isNaN(bgWidth))
            {
                context.drawImage(bgImg, 0, bgTop, bgWidth, bgHeight, 0, 0, toolIconWidth, toolIconWidth);
            }

            context.drawImage(bgImg, 0,srcTop, srcWidth, srcHeight, 0,0, toolIconWidth, toolIconWidth);
        });
    }

    angular.module('MapEditor',[])
        .factory('MapService', ['$http', function($http){
            return {
                get : function(id){
                    return $http.get('/maps/'+id.toLowerCase());
                },
                createNew : function(){
                    var model = {
                        id:'',
                        column:10,
                        row:10,
                        grid:[],
                        filter:'none',
                        isExisting : false
                    };

                    for(var i=0; i<model.row; i++)
                    {
                        model.grid.push([]);
                        for(var j=0; j<model.column; j++)
                        {
                            model.grid[i].push(defaultAreaType);
                        }
                    }
                    return model;
                },
                save : function(data){
                    return $http.post('/maps/'+data.id,
                        {params:data});
                },
                remove : function(mapId){
                    return $http.post('/maps/delete/'+mapId, {});
                }
            }

        }])
        .controller('MapController',['$scope', '$compile','MapService', function($scope, $compile, MapService){
            $scope.map = MapService.createNew();
            $scope.selectedArea = 0;
            $scope.alert ={};

            var map = document.getElementById('map');
            var mapContext = map.getContext('2d');

            function adjustMapTable(){
                var model = $scope.map;
                var newWidth = model.column * gridSize;
                var newHeight = model.row  * gridSize;

                var row=model.row, column=model.column;
                var $mapTable = $('#map-table');
                $mapTable.empty().width(newWidth).height(newHeight);
                for(var i=0; i<row; i++){
                    $tr = $('<div class="map-row" />');
                    for(var j=0; j<column; j++)
                    {
                        var $td = $('<div class="map-inner" />');
                        $td.attr('ng-click','fillMap('+i+','+j+')');
                        $tr.append($td);
                    }

                    $mapTable.append($compile( $tr.html())($scope));
                }
            }

            function redrawMap(){
                var model = $scope.map;
                mapContext.clearRect(0,0,map.width,map.height);
                for(var i=0; i<model.row; i++)
                {
                    for(var j=0; j<model.column; j++)
                    {
                        var type = model.grid[i][j];
                        var $areaCanvas = $('#area'+type);

                        if($areaCanvas.length == 0) continue;
                        var areaCanvas = $areaCanvas[0];
                        mapContext.drawImage(areaCanvas,0,0,toolIconWidth,toolIconWidth,j*gridSize,i*gridSize,gridSize,gridSize);
                    }
                }
            }

            function adjustMapSize(){
                var newWidth = $scope.map.column * gridSize;
                var newHeight = $scope.map.row  * gridSize;
                $('#map-wrapper').height(newHeight+2);
                $(map).attr('width', newWidth).attr('height', newHeight);
            }

            function adjustMapData(){
                var model = $scope.map;
                var oldRow =model.grid.length;
                var oldColumn = model.grid[0].length;

                for(var i=0; i < model.grid.length; i++)
                {
                    if(oldColumn < model.column)
                    {
                        for(var j=oldColumn; j< model.column; j++)
                        {
                            model.grid[i].push(defaultAreaType);
                        }
                    }
                    else
                    {
                        for(var j= oldColumn; j> model.column; j--)
                        {
                            model.grid[i].pop();
                        }
                    }
                }

                if(oldRow < model.row)
                {
                    for(var i =oldRow; i< model.row; i++)
                    {
                        model.grid.push([]);
                        for(var j=0; j<model.column; j++)
                        {
                            model.grid[i].push(defaultAreaType);
                        }
                    }
                }
                else if(oldRow > model.row)
                {
                    for(var i= oldRow; i> model.row; i--)
                    {
                        model.grid.pop();
                    }
                }
            }

            function adjustMap(){
                var model = $scope.map;

                if(model.row == undefined || model.column == undefined || model.row < 10 || model.row > 90 ||
                    model.column < 10 || model.column > 90)
                    return;

                adjustMapSize();
                adjustMapTable();
                adjustMapData();
                redrawMap();
            }

            $scope.selectAreaType = function(pos){
                $scope.selectedArea = pos;
            };

            $scope.fillMap = function(row, col){
                if($scope.selectedArea == 0)
                    return;

                $scope.map.grid[row][col]=$scope.selectedArea;
                var areaCanvas = document.getElementById('area'+$scope.selectedArea);
                mapContext.clearRect(col * gridSize, row * gridSize,gridSize,gridSize);
                mapContext.drawImage(areaCanvas,0,0, toolIconWidth, toolIconWidth, col * gridSize, row * gridSize,
                gridSize, gridSize);
            };

            var bgImg = document.createElement('img');
            bgImg.src='/images/game/bg_sprite.gif';
            bgImg.onload =  function(){
                initAreaCanvas(bgImg);
                adjustMap();

                $scope.$watch('[map.row, map.column] | json', function(){
                    adjustMap();
                });
            };

            function copyObject(from, to, exceptions)
            {
                for(var prop in  from)
                {
                    if(exceptions == null || $.inArray(prop,exceptions) == -1)
                    {
                        to[prop] = from[prop];
                    }
                }
            }

            $scope.loadMap = function(mapId){
                MapService.get(mapId)
                    .success(function(data){
                        copyObject(data,$scope.map, ['exits']);
                        $scope.map.row = data.grid.length;
                        $scope.map.column = data.grid[0].length;
                        $scope.map.isExisting = true;
                        $scope.alert=null;
                        adjustMap();
                    })
                    .error(function(data){
                        alert('Failed to load map!');
                    });
            };

            $scope.newMap = function(){
                var data =MapService.createNew();
                copyObject(data,$scope.map);
                adjustMap();
                $scope.alert=null;
            };

            $scope.save = function(){
                if($scope.form.$invalid)
                    return;

                delete $scope.alert.errors;

                MapService.save($scope.map)
                    .success(function(data)
                    {
                        if(!data.success)
                        {
                            $scope.alert.errors = data.errors;
                        }
                        else
                        {
                            alert('Map was saved successfully!');
                            window.document.location.href='/';
                        }
                    })
                    .error(function(){

                    });
            };

            $scope.delete = function(){
                if(! confirm('Are you sure to delete '+$scope.map.id+' ?'))
                    return;

                MapService.remove($scope.map.id)
                    .success(function(data){
                        alert('Map was deleted successfully!');
                        window.document.location.href='/';
                    })
                    .error(function(data){
                        alert('Failed to delete '+ $scope.map.id);
                    });
            }
        }]);

})(jQuery, angular, window);

