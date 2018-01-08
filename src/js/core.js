// core.js - JS that can run after content is loaded
////////////////////////////////////////////////////////////////////////////////

// Handles all the clicks on the page. Decides which function to call when something is clicked.
var clickHandler = {
    event: {},
    target: {}

    // Chooses which function to call, based on what was clicked etc.
    // Called by event listener, so [this] != clickHandler.
    ,exe: function(e) {                     // e(vent)
        clickHandler.event = e;             // Set event
        clickHandler.target = e.target;     // Set target

        if(logging===true) {
            console.log("clickHandler: Something was clicked");
            console.log("    event: ", e);
            console.log("    target: ", e.target, "\n\n");
        }

        // Internal link: Check if target is an <a> and href starts with [#/]
        if(e.target.nodeName === "A" && e.target.getAttribute("href").substring(0,2) === "#/") {
            clickHandler.internalLinkWasClicked(e.target); 
        }

        // External link: Check if target is an <a> and first char in href is not [#]
        if(e.target.nodeName === "A" && e.target.getAttribute("href").substring(0,1) !== "#") {
            clickHandler.externalLinkWasClicked(e.target); 
        }

        // On-page link
        if(e.target.className.indexOf("u-link-onpage") !== -1) onpageLinkHandler.linkWasClicked(e.target);
        if(e.target.className.indexOf("u-backbutton-link-onpage") !== -1) onpageLinkHandler.backButtonWasClicked();

        // Portfolio
        if(currentPage.url === "/_work.html") {
            // Portfolio image is clicked
            if(e.target.className.indexOf("portfolio-image") !== -1 ) {
                portfolioHandler.imageWasClicked(e.target);
            }
            // Caption text is clicked
            if(e.target.className.indexOf("portfolio-caption") !== -1 ) {
                portfolioHandler.clickedAgain(e.target);
            }
            // Caption box *containing* the text is clicked (the Parent element)
            if(e.target.parentElement.className.indexOf("portfolio-caption") !== -1 ) {
                portfolioHandler.clickedAgainP(e.target);
            }
        }

    } // end exe

    // Run when an internal link is clicked (a williams.blue link)
    ,internalLinkWasClicked: function(target) {
        this.event.preventDefault();            // Prevent unwanted default behavior. [this] = clickHandler.
        this.event.stopPropagation();           // We're done with the event now
        var url = this.target.getAttribute("href").substring(1); // Url from root, eg [/_me.html]. No hash.

        // If a link is clicked, we're not moving through history anymore.
        currentPage.historical = false;

        // Detect if user wanted to open link in new tab
        if( this.event.ctrlKey || 
            this.event.shiftKey || 
            this.event.metaKey ||                           // Apple command key
            (this.event.button && this.event.button == 1)   // Middle click
        ) {
            var newTabUrl = "/index.html#" + url;           // Create off-page link
            var win = window.open(newTabUrl, "_blank");     // Create new tab
            if(win) {           // If we were able to create the new tab (eg wasn't blocked by popup blocker)
                win.focus();    // Go to new tab
                return;         // Return from function so that content is not loaded in original page.
            } else alert("Could not open link in new tab. Maybe it was blocked by your popup blocker.");
        }

        loadPage(url);      // Load content in current page.
    }

    // Run when an external link is clicked (not a williams.blue link)
    ,externalLinkWasClicked: function(target) {
        this.event.preventDefault();            // Prevent unwanted default behavior. [this] = clickHandler.
        this.event.stopPropagation();           // We're done with the event now
        var url = this.target.getAttribute("href");

        var win = window.open(url, "_blank");     // Create new tab
        if(win) {           // If we were able to create the new tab (eg wasn't blocked by popup blocker)
            win.focus();    // Go to new tab
        } else alert("Could not open link in new tab. Maybe it was blocked by your popup blocker.");        
    }
};

var onpageLinkHandler = {

    link: {}
    ,element: {}
    ,backButton: {
        distanceToTop: 0
    }

    ,linkWasClicked: function(link) {
        // The link that was clicked. Make it accessible by other functions.
        this.link = link;

        // The destination element
        // Get the destination element via the data of the clicked element.
        var element = document.querySelector(link.getAttribute("data-link-onpage"));
        this.element = element; // Make it accessible by other functions.

        element.classList.add("u-position-relative");  // So we can position the button next to it

        this.scrollIntoViewAndHighlight(element);
        
        // Check if back button already exists. Remove if it does.
        var oldBackButton = document.querySelector(".u-backbutton-link-onpage");
        if(oldBackButton) this.removeBackButton(oldBackButton);

        // Creates a button that will take the user back to the previous element they were looking at.
        // The button is displayed adjacent to the new element.
        this.backButton = document.createElement("button");     // Create back button
        var backButton = this.backButton;                       // Less typing
        backButton.distanceToTop = window.scrollY;              // Get current distance from top of page
        backButton.classList.add("u-button-simple", "u-backbutton-link-onpage");
        backButton.innerHTML = "Go back";

        // Back button appears after highlight disappears (1.5s). Scroll event listener is attached
        window.setTimeout(function(){
            element.appendChild(backButton);  // Back button appears after element highlighted

            // Back button will fade away on scroll. Event listener is attached after highlight disappears.
            // Function needs to know where on the page we started and what button we're looking at.
            window.addEventListener("scroll", onpageLinkHandler.runOnScroll);
        }, 1500);
    }

    ,backButtonWasClicked: function() {
        this.scrollIntoViewAndHighlight(this.link);     // Scroll back to previous element when clicked
        this.removeBackButton(this.backButton);         // Remove the back button and scroll listener
    }

    ,scrollIntoViewAndHighlight: function(element) {
        element.scrollIntoView();                       // Scroll element into view
        element.classList.add("u-_lookatme");           // Make element noticeable

        window.setTimeout(function() {                  // Remove noticeable class after 1.5s
            element.classList.remove("u-_lookatme");
        }, 1500);
    }

    ,runOnScroll: function() {
        var backButton = onpageLinkHandler.backButton; // Less typing

        // Get distance scrolled away from back button
        var d = window.scrollY - backButton.distanceToTop;

        d = Math.abs(d);                                // Make sure value is positive (distance)
        var threshold = 300;                            // Threshold to remove the button (in px)

        // Back button disappears as user scrolls away. It's completely gone when threshold is reached.
        backButton.style.opacity = (threshold - d) / threshold;

        // If user scrolls past the threshold, remove the back button etc
        if( d > threshold) {
            onpageLinkHandler.removeBackButton();
        }
    }

    // Remove back button and other stuff we used.
    ,removeBackButton: function() {
        this.backButton.parentElement.classList.remove("u-position-relative");
        this.backButton.parentElement.removeChild(this.backButton);
        window.removeEventListener("scroll", onpageLinkHandler.runOnScroll);
    }
};

function hideLoadingNotification(){
    loadingNotification.classList += " u-_is-absent";
};

////////////////////////////////////////////////////////////////////////////////
// code that runs

// Runs after page is loaded
(function runAfterPageLoadsCore() {
    // hideLoadingNotification();
})();