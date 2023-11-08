// ==UserScript==
// @name Hide Wordpress admin bar
// @namespace tag:vagary.shouter0u@icloud.com,2022-11-11:scripts
// @version 0.1
// @description Hides obnoxious admin bar on wordpress page, reveals on double click or child focus.
// @author You
// @match localhost/*
// @match *.local/*
// @exclude *localhost/*/wp-admin/*
// @exclude *.local/wp-admin/*
// @icon www.google.com
// @grant none
// ==/UserScript==

(function() {

  'use strict';

  function hideBar() {

    let adminBar = document.getElementById('wpadminbar');
    document.querySelector('html').style.background = '#15574A';

    let opacity = 0;

    let toggleOpacity = () => {
      opacity = opacity == 1 ? 0 : 1;
    }

    adminBar.addEventListener( "focus", function (e) {
      this.style.opacity = 1;
    }, true);

    adminBar.addEventListener( "blur", function (e) {
      this.style.opacity = 0;
    }, true);

    adminBar.addEventListener( "dblclick", function (e) {
      //todo make this better
      toggleOpacity();
      this.style.opacity = opacity;
    }, false);

    adminBar.style.opacity = 0;
  }

  hideBar();

})();