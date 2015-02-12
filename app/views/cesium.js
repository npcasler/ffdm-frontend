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
    var viewer = this.get('controller').get('viewer');
    var camera = viewer.camera;
    camera.flyTo({ 
        destination: Cesium.Cartesian3.fromDegrees(-111.100, 36.998, 5000000.0)
    });
    console.log(camera.positionCartographic);
  }

});
