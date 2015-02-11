import Ember from 'ember';
/* global Cesium */
export default Ember.View.extend({

  didInsertElement: function() {
    var CESIUM_BASE_URL = '.';
    var proxy = this.get('controller').get('proxy');
    var rcp = this.get('controller').get('rcp');
    var species = this.get('controller').get('species');
    
    console.log("Cesium_base_url is: "+ CESIUM_BASE_URL);
    console.log('Cesium view DidInsertElement Called.');
    var viewer = this.get('controller').get('viewer');
    viewer = new Cesium.Viewer('cesiumContainer', {
      //Add starting base map
      imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
        url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
      }),
      animation: false, 
      baseLayerPicker: true,
      timeline: false
    });
    console.log(viewer);
    var camera = viewer.camera;
    var scene = viewer.scene;
    var west = -125.021;
    var south = 24.060;
    var east = -97.179;
    var north = 49.935;

    var extent = new Cesium.Rectangle.fromDegrees(west, south, east, north);
    
//    camera.flyTo({
  //      destination: extent
  //  });
    
    var imageryLayers = this.get('controller').get('imageryLayers');
    imageryLayers = viewer.scene.imageryLayers;
    this.get('controller').set('imageryLayers', imageryLayers);
    //var wms = new Cesium.TileMapServiceImageryProvider({
   // this.get('controller').stepClock();

    this.initCB();
  },

  initCB: function() {
    console.log('initCB has been called by CesiumView');
    this.get('controller').setupLayers();
  }

});
