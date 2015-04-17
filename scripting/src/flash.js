
// This code handles flash messages, i.e., notifications atop the page (in the navbar).

module.exports = function(utils, $, _) {
    // Animate the flash messages.
    function animateFlash() {
        // When only one h1 remains, it is the title.
        if ($('#navbar>h1').length < 2) return;

        // The last h1 in the markup is the current flash.
        var elem = $('#navbar>h1').last();
        elem
            .css({opacity: 0, top: 20})
            .animate({opacity: 1, top: 0}, 500)
            .delay(4000)
            .animate({opacity: 0, top: -20}, 500, function() {
                elem.remove();
                if ($('#navbar>h1').length < 2)
                    restoreTitle();
                else
                    animateFlash();
            });
    }

    // Restore page title after last flash message.
    function restoreTitle() {
        $('#navbar>h1')
            .css({opacity: 0, top: 20})
            .animate({opacity: 1, top: 0}, 500)
    }

    // Doesn't need to be run immediately.
    //_.defer(animateFlash);
    animateFlash();
}
