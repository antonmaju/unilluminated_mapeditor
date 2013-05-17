(function($, angular, window){

    var toolIconWidth = 32;
    var defaultAreaType = 1;
    var gridSize =32;

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



    function redrawMap(model){

        var map = document.getElementById('map');
        var mapContext = map.getContext('2d');
        //mapContext.clearRect(0,0,map.width,map.height);
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

    angular.module('MapEditor',[])
        .factory('MapService', function($http){

            return {
                load : function(name){

                },
                createNew : function(){
                    var model = {
                        id:'',
                        column:10,
                        row:10,
                        grid:[],
                        filter:'none'
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
                }
            }

        })
        .controller('MapController', function($scope, $compile, MapService){
            $scope.map = MapService.createNew();
            $scope.selectedArea = 0;

            function adjustMapTable(model){
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

                    //$mapTable.append($tr);
                }
            }

            function adjustMapSize(model){
                var newWidth = model.column * gridSize;
                var newHeight = model.row  * gridSize;
                $('#map-wrapper').height(newHeight+2);
                $('#map').attr('width', newWidth).attr('height', newHeight);
                adjustMapTable(model);
            }


            $scope.selectAreaType = function(pos){
                $scope.selectedArea = pos;
            };

            $scope.fillMap = function(row, col){
                if($scope.selectedArea == 0)
                    return;
                var context = document.getElementById('map').getContext('2d');
                var areaCanvas = document.getElementById('area'+$scope.selectedArea);
                context.drawImage(areaCanvas,0,0, toolIconWidth, toolIconWidth, col * gridSize, row * gridSize,
                gridSize, gridSize);
            };

            adjustMapSize($scope.map);

            var bgImg = document.createElement('img');
            bgImg.src='/images/game/bg_sprite.gif';
            bgImg.onload =  function(){
                initAreaCanvas(bgImg);
                redrawMap($scope.map);
            };

        });

})(jQuery, angular, window);

