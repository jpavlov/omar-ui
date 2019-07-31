"use strict";
angular
    .module('omarApp')
    .component('modal', {
        templateUrl: AppO2.APP_CONFIG.serverURL + '/views/modal/modal.template.html',
        controller: ModalController,
        bindings: {
            modalInstance: '<',
            resolve: '<',
            close: '&',
            dismiss: '&'
        }
    });

function ModalController($scope) {
    // Source key list
    this.meta = {
        'Source': ['id', 'DB ID', 'Mission', 'Sensor', 'Product ID', 'Organization', 'Country Code', 'WAC Code', 'Image Representation'],
        'Metrics': ['NIIRS', 'Azimuth Angle', 'Grazing Angle', 'Sun Azimuth', 'Sun Elevation', 'Cloud Cover', 'Number of Bands', 'Number of Resolution Levels', 'Bit Depth'],
        'File': ['Type', 'filename', 'Entry ID'],
        'Dimensions': ['Height', 'Width'],
        'General': ['Description', 'Title', 'Security Classification'],
        'Geometry': ['GSD Unit', 'GSD X', 'GSD Y']
    }
    console.log('this.meta', this.meta)
    this.sourceItems = ['id', 'DB ID', 'Mission', 'Sensor', 'Product ID', 'Organization', 'Country Code', 'WAC Code', 'Image Representation']
    this.metricItems = ['NIIRS', 'Azimuth Angle', 'Grazing Angle', 'Sun Azimuth', 'Sun Elevation', 'Cloud Cover', 'Number of Bands', 'Number of Resolution Levels', 'Bit Depth']
    this.fileItems = ['Type', 'filename', 'Entry ID']
    this.dimensionItems = ['Height', 'Width']
    this.generalItems = ['Description', 'Title', 'Security Classification']
    this.geometryItems = ['GSD Unit', 'GSD X', 'GSD Y']

    this.$onInit = function() {
        this.modalData = this.resolve.modalData;
    }

    this.ok = function () {
        this.close({$value: 'ok'});
    }

    this.cancel = function () {
        this.dismiss({$value: 'cancel'});
    }

    console.log('this!', this)
}