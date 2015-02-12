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
    var viewer = new Cesium.Viewer('cesiumContainer', {
      //Add starting base map
      imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
        url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
      }),
      animation: false, 
      baseLayerPicker: true,
      timeline: false
    });
    viewer.clock.onTick.addEventListener(function(clock) {
      var camera = viewer.camera;
    });
    this.get('controller').set('viewer', viewer);
    console.log(viewer);
    var camera = viewer.camera;
    var scene = viewer.scene;


    
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
   /*
    var west = -125.021;
    var south = 24.060;
    var east = -97.179;
    var north = 49.935;
*/
    var west = -90.0;
    var south = 38.0;
    var east = -87.0;
    var north = 40.0;
    var rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
    console.log(rectangle);
    var viewer = this.get('controller').get('viewer');
    var scene = viewer.scene;
    console.log(viewer);
    console.log(scene);
    var camera = viewer.camera;
    /*camera.setView({
      position: Cesium.Cartesian3.fromDegrees(-117.16, 32.71, 15000.0),
      heading: 0.0,
      pitch: -Cesium.Math.PI_OVER_TWO,
      roll:0.0
    });*/

/*
   camera.flyTo({ 
        destination: Cesium.Cartesian3.fromDegrees(-117.16, 32.71, 15000.0)
    });*/

    viewer.camera.flyTo({
        destination: rectangle
    });
  }

});
