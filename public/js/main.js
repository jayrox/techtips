function updateTip() {
    $.ajax({
        url: "/tip",
    })
    .done(function( data ) {
        if ( console && console.log ) {
            console.log(data);
        }
        $("#tip").fadeOut(function() {
            $('#tip').text(data.tip);
        }).fadeIn();
        var path = "http://tech-tips/" + data.stub;
        $("#url").fadeOut(function() {
            $('#url').text(path);
        }).fadeIn();
        $('#url').attr("href", path);
    });
}