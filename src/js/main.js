/**
 * main.js
 */

const currentPage = {
    "url": window.location.pathname
};

// Handles all the clicks on the page. Decides which function to call when something is clicked.
const clickHandler = {
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

        // On-page link
        if(e.target.className.indexOf("u-link-onpage") !== -1) onpageLinkHandler.linkWasClicked(e.target);
        if(e.target.className.indexOf("u-backbutton-link-onpage") !== -1) onpageLinkHandler.backButtonWasClicked();

        // Gallery
            // Gallery image is clicked
            if(e.target.className.indexOf("gallery-image") !== -1 ) {
                galleryHandler.imageWasClicked(e.target);
            }
            // Caption text is clicked
            if(e.target.className.indexOf("gallery-caption") !== -1 ) {
                galleryHandler.clickedAgain(e.target);
            }
            // Caption box *containing* the text is clicked (the Parent element)
            if(e.target.parentElement.className.indexOf("gallery-caption") !== -1 ) {
                galleryHandler.clickedAgainP(e.target);
            }

    } // end exe
};

const onpageLinkHandler = {

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

const currentPageNavLinkUnderline = function() {
    var b = currentPage.url; // So I can type less
    if(b === "/") b = "/index.html"; // Index.html doesn't show in url
    if(b === "/index.html" || b === "/posts.html" || b === "/code.html" || b === "/design.html" || b === "/me.html") {
        let els = document.querySelectorAll('.link-nav[href*="' + b + '"]')
        for (let i = 0, l = els.length; i < l; i++) {
            els[i].classList.add("u-_is-current-nav-link");
        }
    }
};

const galleryHandler = {

    lastImageThatWasClicked: false

    ,imageWasClicked: function(target) {
        if(this.lastImageThatWasClicked !== false) this.lastImageThatWasClicked.parentElement.querySelector("div").classList.add("u-_is-invisible");
        this.lastImageThatWasClicked = target;
        target.parentElement.querySelector("div").classList.remove("u-_is-invisible");
    }

    ,clickedAgain: function(target) {
        target.classList.add("u-_is-invisible");
    }
    ,clickedAgainP: function(target) {
        target.parentElement.classList.add("u-_is-invisible");
    }

};

// Code that runs //////////////////////////////////////////////////////////////////////////////////
var logging = false;
// if(logging===true)console.log("", "\n\n");
console.log("logging: ", logging, "\n\n");

// Listen for clicks on the page
document.body.addEventListener("click", clickHandler.exe, false);

// Underline current nav link
currentPageNavLinkUnderline();
