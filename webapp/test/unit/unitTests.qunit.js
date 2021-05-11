/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"products/sapui5_products/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
