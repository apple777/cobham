define(['/js/lib/jquery.js'], function ( $ ) {
    //** How long it takes for the panel to open or close when the + button is pressed
    var SLIDE_DELAY = 220;

    //** Expands all div.panel.collapsible elements
    function expandAllPanels(){
        $("div.panel.collapsible div.minmaxbutton").trigger("expand");
    }

    //** Collapses all div.panel.collapsible elements
    function collapseAllPanels(){
        $("div.panel.collapsible div.minmaxbutton").trigger("collapse");
    }

    /**
     * Look for all the panels that have the class "collapsible" and add a small icon there for minimize/maximize functionality.
     * @note The collapsible panels should have a div.header and div.contents as their children.
     */
    function setSlidingEffect(){
        //add this thing to all the panels which are defined as collapsible
        $("div.panel.collapsible").each(function(index,element){
            //check to see if this thing doesn't exist before adding it!
            if($(this).children("div.minmaxbutton").size()>0)return;
            var expandCollapseIcon=$(document.createElement("div"));
            expandCollapseIcon.addClass("icon minimize minmaxbutton");
            //bind a click event to this icon
            var evtTarget=$(element).children("div.contents");
            if(evtTarget==null){
                console.error("One div.panel is defined as .collapsible but doesn't have a div.contents inside it.");
                return;
            }
            //custom event to minimize the contents
            expandCollapseIcon.bind("collapse",{target:evtTarget},function(e){
                e.data.target.hide(SLIDE_DELAY);
                $(this).removeClass("minimize").addClass("maximize");
            });
            //custom event to maximize the contents
            expandCollapseIcon.bind("expand",{target:evtTarget},function(e){
                e.data.target.show(SLIDE_DELAY);
                $(this).removeClass("maximize").addClass("minimize");
            });
            //this is the toggle event
            expandCollapseIcon.bind("click",{target:evtTarget},function(){
                if($(this).hasClass("minimize")){
                    //the panel is already expanded
                    $(this).trigger("collapse");
                }else if($(this).hasClass("maximize")){
                    //the panel is already collapsed
                    $(this).trigger("expand");
                }else{
                    console.error("Could detect either minimize or maximize class on the expand button");
                }
            });
            //now add the icon to the header element in this div
            $(element).children("div.header").prepend(expandCollapseIcon);
            console.log("Sliding effect set for div.panel#"+$(this).attr("id"));
        });
    }

    //run on the current page and add that little plus button to the sliding panels
    $( function () {
        setSlidingEffect();
    });

    return {
        collapseAllPanels: collapseAllPanels,
        expandAllPanels: expandAllPanels,
        setSlidingEffect: setSlidingEffect
    }
});