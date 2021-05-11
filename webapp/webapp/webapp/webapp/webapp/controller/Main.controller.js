sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (Controller, Fragment, Filter, FilterOperator, JSONModel, MessageBox) {
        "use strict";

        return Controller.extend("products.sapui5products.controller.Main", {
            onInit: function () {
                this._oProdInput = this.byId("productInput");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._oDataModel.setUseBatch(false);
                this._oViewModel = new JSONModel({
                    selectedProduct: null,
                    isEditMode: false,
                    isProdLoaded: false,
                    selectedProdPersistForEdit: null,
                });
                this.getView().setModel(this._oViewModel, "prodView");
                this._oGlobalDialog = new sap.m.BusyDialog({ showCancelButton: true });
            },
            onValueHelpRequest: function (oEvent) {
                var sInputValue = oEvent.getSource().getValue(),
                    oView = this.getView();
                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "products.sapui5products.view.ValueHelpDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }
                this._pValueHelpDialog.then(function (oDialog) {
                    // Create a filter for the binding
                    oDialog.getBinding("items").filter([new Filter("Name", FilterOperator.Contains, sInputValue)]);
                    // Open ValueHelpDialog filtered by the input's value
                    oDialog.open(sInputValue);
                });
            },
            onValueHelpSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new Filter("Name", FilterOperator.Contains, sValue);

                oEvent.getSource().getBinding("items").filter([oFilter]);
            },
            onValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);

                if (!oSelectedItem) {
                    return;
                }

                this._oProdInput.setValue(oSelectedItem.getDescription());
                this._fetchData(oSelectedItem.getTitle());
            },
            onEdit: function (oEvt) {
                this._setEditMode(true);
            },
            onCancel: function (oEvt) {
                this._oViewModel.setProperty("/selectedProduct", { ...this._oViewModel.getProperty("/selectedProdPersistForEdit") });
                this._setEditMode(false);
            },
            onSave: function (oEvt) {
                var oDataPayload = this._oViewModel.getProperty("/selectedProduct");
                this._updateData(oDataPayload);
            },
            _fetchData: function (sKey) {
                var sPath = "/Products(" + sKey + ")";
                this._oGlobalDialog.open();
                this._oDataModel.read(sPath, {
                    success: function (oSelectedProd) {
                        this._oViewModel.setProperty("/selectedProduct", oSelectedProd);
                        this._oViewModel.setProperty("/isProdLoaded", true);
                        this._oGlobalDialog.close();
                    }.bind(this),
                    error: function (sError) {
                        this._oViewModel.setProperty("/selectedProduct", null);
                        this._oViewModel.setProperty("/isProdLoaded", false);
                        this._oGlobalDialog.close();
                        this._displayMessage("prodNotFound", this._oProdInput.getValue(), MessageBox.error);
                    }
                });
            },
            _setEditMode: function (editMode) {
                this._oViewModel.setProperty("/isEditMode", editMode);
                if (editMode) {
                    this._oViewModel.setProperty("/selectedProdPersistForEdit", { ...this._oViewModel.getProperty("/selectedProduct") });
                } else this._oViewModel.setProperty("/selectedProdPersistForEdit", null);
            },
            _displayMessage: function (sMsgKey, aMsgParams, callback) {
                var oBundle = this.getView().getModel("i18n").getResourceBundle(),
                    sMsg = oBundle.getText(sMsgKey, aMsgParams);
                callback(sMsg);
            },
            _updateData: function (oDataPayload) {
                var sPath = "/Products(" + oDataPayload.ID + ")";
                this._oGlobalDialog.open();
                this._oDataModel.update(sPath, oDataPayload, {
                    success: function (oSelectedProd) {
                        this._oViewModel.setProperty("/isProdLoaded", true);
                        this._setEditMode(false);
                        this._displayMessage("prodUpdated", this._oProdInput.getValue(), MessageBox.success);
                        this._oGlobalDialog.close();
                    }.bind(this),
                    error: function (sError) {
                        this._oGlobalDialog.close();
                        this._displayMessage("prodNotUpdated", this._oProdInput.getValue(), MessageBox.error);
                    }
                });
            }
        });
    });
