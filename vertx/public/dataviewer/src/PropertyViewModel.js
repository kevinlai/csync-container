/*
 * Copyright IBM Corporation 2016-2017
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ko = require('knockout');
var $ = require('jquery');
//UI Elements
var treeElem = $(".content");
var editButton = $("#editButton");
var saveButtonElem = $("#saveButton");
var cancelButton = $("#cancelButton");
var noDataText = $("#noDataText");
var noACL = $("#noACL");
var acl = $("#acl");
var deleteButtonElem = $("#deleteButton");
var header = document.getElementById("header-div");
var treeDiv = document.getElementById("jstree");
var leftPanel = document.getElementById("left-panel");
var middlePanel = document.getElementById("middle");
var selectedNode = {};

module.exports = function(tree, shouter, worker) {
    var currVal = "";
    var propertiesElem = $('#node_properties');
    var self = this;
    
    //table ovservable
    self.properties = ko.observableArray();
    self.editBox = ko.observable({});

    //subscribe to tree's selected node 
    tree.selectedNode.subscribe(function (node) {
        self.setInfo(node);
        self.initKeyValue(node.data);
    });

    //publish to Tree delete node
    self.deleteNode = function () {
        var deleteObj = {
            key: tree.selectedNode().id,
            text: tree.selectedNode().text,
            type: "delete_node"
        }
        worker.postMessage(deleteObj);  
    }

    //publish to Tree add node
    self.addNodeButton = function (data) {
        data.status = "valid";
        shouter.notifySubscribers(data, "addNode");
        $("#addNode").prop("disabled", true);
    }

    self.editButton = function () {
        var input = $("#editBox");
        treeElem.css({ 'color': '#3d3d3d' });
        var buttonName = editButton.text();
        currVal = input.val();
        editButton.hide();
        saveButtonElem.show();
        saveButtonElem.css("display", "flex");
        cancelButton.show();
        propertiesElem.hide();
        input.show();
        deleteButtonElem.prop("disabled", true);
        $("#addNode").prop("disabled", true);
        toggleDivs("none");
    }

    self.saveButton = function () {
        toggleDivs("auto");
        var input = $("#editBox");
        treeElem.css({ 'color': '#3d3d3d' });
        editButton.prop("disabled", false);
        $("#addNode").prop("disabled", false);
        var data = {};
        saveButtonElem.hide();
        cancelButton.hide();
        editButton.show();
        data = input.val();
        propertiesElem.show();
        $('.dataValueInput').hide();
        input.hide();
        // write new info to csync
        var writeObj = {
            key: tree.selectedNode().id,
            type: "update_data",
            text: tree.selectedNode().text,
            parent: tree.selectedNode().parent,
            data: JSON.stringify(data)
        };
        // send worker a write task
        worker.postMessage(writeObj);
    }
    
    self.cancelButton = function () {
        //cancel any changes
        var input = $("#editBox");
        saveButtonElem.hide();
        cancelButton.hide();
        editButton.show();
        treeElem.css({ 'color': '#3d3d3d' });
        propertiesElem.show();
        input.val = currVal;
        input.hide();
        self.editBox(currVal);
        deleteButtonElem.prop("disabled", false);
        $("#addNode").prop("disabled", false);
        toggleDivs("auto");
    }

    self.initKeyValue = function (data) {
        self.editBox(JSON.stringify(data, null, 2));
        self.properties.removeAll();
        noDataText.hide();

        if (data === null || (typeof data === "object" && Object.keys(data).length === 0)){
            noDataText.show();
            return;
        }
        if(Object.keys(data).length === 0){
            self.properties.push(new PropertyModel(tree.selectedNode().text, data));
            return;
        }
        for (var key in data) {
            if (key === "0") {
                self.properties.push(new PropertyModel(tree.selectedNode().text, data));
                return;
            }
            self.properties.push(new PropertyModel(key, data[key]));
        }
        self.properties.sort();
    }

    self.setInfo = function(node){
        if(node.original.acl !== undefined){
            noACL.hide();
            acl.text("ACL: " + node.original.acl);
            acl.show();
        }
    }

    function toggleDivs(command){
    //reset the unclickable elements
        if(command === "auto"){
            middlePanel.removeEventListener("click", alertUser, false);
        }
        else {
            middlePanel.addEventListener("click", alertUser, false);
        }
        treeDiv.style.pointerEvents = command;
        leftPanel.style.pointerEvents = command;
        header.style.pointerEvents = command;
    }

    function alertUser() {
        treeElem.css({ 'color': '#bdbdbd' });      
        alert("Please finish editing. Click Cancel or Save to continue!");  
    }
}
//data model for the properties table
function PropertyModel(key, value) {
    self.keyValue = key;
    self.dataValue = JSON.stringify(value, null, 2);
}