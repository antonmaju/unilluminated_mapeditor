exports.isInteger = function(value){

    if(value == null)
        return false;


    return typeof value === 'number' && value % 1 == 0;
};