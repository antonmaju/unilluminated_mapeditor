(function($, angular, window){

    var toolIconWidth = 32;


    function initAreaCanvas(){

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

    var bgImg = document.createElement('img');
    bgImg.src='/images/game/bg_sprite.gif';
    bgImg.onload = initAreaCanvas;

})(jQuery, angular, window);

