"use strict";

var toggleTocButton = function toggleTocButton() {
  var btnconfig = document.getElementById("toc_block");
  btnconfig.style.display === "none" ? btnconfig.style.display = "block" : btnconfig.style.display = "none";
};