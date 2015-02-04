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
    var clock = this.get('controller').get('clock');
    clock = new Cesium.Clock({
      startTime : Cesium.JulianDate.fromIso8601('2011-01-01'),
      currentTime: Cesium.JulianDate.fromIso8601('2011-01-01'),
      stopTime: Cesium.JulianDate.fromIso8601('2081-01-01'),
      clockRange: Cesium.ClockRange.LOOP_STOP,
      clockStep: Cesium.ClockStep.TICK_DEPENDENT,
      multiplier: 52560000,
      shouldAnimate: 0
    });
    this.get('controller').set('clock', clock);
    
    var viewer = this.get('controller').get('viewer');
    viewer = new Cesium.Viewer('cesiumContainer', {
      imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
        url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
      }),
      baseLayerPicker: true,
      clock: clock
    });
    console.log(viewer);

    var imageryLayers = this.get('controller').get('imageryLayers');
    imageryLayers = viewer.scene.imageryLayers;
    this.get('controller').set('imageryLayers', imageryLayers);
    //var wms = new Cesium.TileMapServiceImageryProvider({
    this.get('controller').stepClock();

    this.initCB();
  },

  initCB: function() {
    console.log('initCB has been called by CesiumView');
    this.get('controller').setupLayers();
  }

});
