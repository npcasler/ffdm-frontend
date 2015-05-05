/* jshint ignore:start */

/* jshint ignore:end */

define('ffdm-frontend/adapters/application', ['exports', 'ember', 'ember-data', 'ffdm-frontend/config/environment'], function (exports, Ember, DS, config) {

  'use strict';

  exports['default'] = DS['default'].RESTAdapter.extend({
    coalesceFindResults: true, // these blueprints support coalescing (reduces the amount of calls)
    namespace: "", // same as API prefix in Sails config
    host: config['default'].APP.API_HOST, //Sails Server
    corsWithCredential: true
  });

});
define('ffdm-frontend/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'ffdm-frontend/config/environment', 'ember-data'], function (exports, Ember, Resolver, loadInitializers, config, DS) {

  'use strict';

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  var App = Ember['default'].Application.extend({
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix,
    Resolver: Resolver['default']
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});
define('ffdm-frontend/components/popup-modal', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    //closeText: 'Close',
    contentText: "",
    //okText: 'Ok',
    actions: {
      ok: function () {
        this.$(".modal").modal("hide");
        this.sendAction("ok");
      }
    },
    show: (function () {
      this.$(".modal").modal().on("hidden.bs.modal", (function () {
        this.sendAction("close");
      }).bind(this));
    }).on("didInsertElement")
  });

});
define('ffdm-frontend/components/x-toggle', ['exports', 'ember', 'ffdm-frontend/config/environment'], function (exports, Ember, ENV) {

  'use strict';

  var observer = Ember['default'].observer;
  var on = Ember['default'].on;
  var computed = Ember['default'].computed;
  var config = ENV['default']["ember-cli-toggle"];

  exports['default'] = Ember['default'].Component.extend({
    tagName: "span",
    classNames: ["x-toggle-container"],
    theme: config.defaultTheme || "default",
    off: config.defaultOff || "Off",
    on: config.defaultOn || "On",
    showLabels: config.defaultShowLabels || false,
    size: config.defaultSize || "medium",
    disabled: false,
    value: false,
    toggled: false,

    onLabel: computed("on", function () {
      return this.get("on").indexOf(":") > -1 ? this.get("on").substr(0, this.get("on").indexOf(":")) : this.get("on");
    }),

    offLabel: computed("off", function () {
      return this.get("off").indexOf(":") > -1 ? this.get("off").substr(0, this.get("off").indexOf(":")) : this.get("off");
    }),

    themeClass: computed("theme", function () {
      var theme = this.get("theme") || "default";

      return "x-toggle-" + theme;
    }),

    forId: computed(function () {
      return this.get("elementId") + "-x-toggle";
    }),

    wasToggled: on("init", observer("toggled", function () {
      var toggled = this.get("toggled");
      var offState = this.get("off").substr(this.get("off").indexOf(":") + 1) || false;
      var onState = this.get("on").substr(this.get("on").indexOf(":") + 1) || true;

      this.sendAction("toggle", toggled);

      if (toggled === false) {
        this.set("value", offState);
      } else {
        this.set("value", onState);
      }
    })),

    valueObserver: on("init", observer("value", function () {
      Ember['default'].run.debounce(this, function () {
        var value = this.get("value");
        var offState = this.get("off").substr(this.get("off").indexOf(":") + 1) || false;
        var onState = this.get("on").substr(this.get("on").indexOf(":") + 1) || true;

        if (value === onState) {
          this.set("toggled", true);
        } else {
          this.set("toggled", false);
          this.set("value", offState);
        }
      }, 500);
    }))
  });

});
define('ffdm-frontend/controllers/carousel', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({

    actions: {
      bcPlay: function (play) {
        console.log("Play button clicked");
        $("#playButton").carousel("cycle");
      },

      bcPause: function (pause) {
        console.log("Pause button clicked");
        $("#pauseButton").carousel("pause");
      }
    }
  });

});
define('ffdm-frontend/controllers/cesium', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    needs: ["plants", "outerras"],
    proxy: "/cgi-bin/proxy.cgi?url=http://scooby.iplantcollaborative.org/maxent/", //allows access to records without opening cors
    species: "", // object holding the record from the plant table
    speciesName: "Populus_tremuloides",
    year: "2011",
    rcp: "rcp26",
    imageryLayers: "",
    imageryViewModels: [], // this will house the base layers
    myTimer: "", // timer for animations
    viewer: "",
    isAnimated: 0, // boolean to signal animations
    years: [1, 2, 3, 4, 5, 6, 7, 8],
    activeDate: 1, // counter to track the current year/layer
    outerrasController: Ember['default'].computed.alias("controllers.outerras"),

    plantsSelected: (function () {
      console.log("plant selection changed " + this.get("species").get("sci_name"));
      this.animateMaps(0);
      $("#rcp-group").css("visibility", "visible");
      this.set("speciesName", this.get("species").get("sci_name"));
      this.remindSubmit();
    }).observes("species"),


    rcpSelected: (function () {
      console.log("rcp selection has changed! " + this.get("rcp"));
      $("#year-group").css("visibility", "visible");
      if (this.get("rcp") === "rcp85") {
        $("#rcp85-label").addClass("active-label");
        $("#rcp26-label").removeClass("active-label");
      } else {
        $("#rcp85-label").removeClass("active-label");
        $("#rcp26-label").addClass("active-label");
      }
      this.remindSubmit();
    }).observes("rcp"),

    animateChanged: (function () {
      var animate = this.get("isAnimated");
      console.log("Animate Changed called");
      if (animate) {
        this.animateMaps(1);
        $("#playPause").removeClass("fa-play");
        $("#playPause").addClass("fa-pause");
      } else {
        $("#playPause").removeClass("fa-pause");
        $("#playPause").addClass("fa-play");
        this.animateMaps(0);
      }
    }).observes("isAnimated"),

    yearChanged: (function () {
      var active = this.get("activeDate");
      var newYear = "20" + active + "1";
      this.set("year", newYear);
      console.log("Year has changed to " + this.get("year"));
    }).observes("activeDate"),


    yearSelected: (function () {
      console.log("year selection changed! " + this.get("selectedYear"));
      $("#submit-group").css("visibility", "visible");
      $("#slider-control").css("visibility", "visible");
    }).observes("selectedYear"),

    createImageryProvider: function (url) {
      var wms = new Cesium.TileMapServiceImageryProvider({
        url: url,
        maximumLevel: 7,
        gamma: 2,
        parameters: {
          transparent: "true",
          format: "image/png"
        }
      });
      return wms;
    },

    setLayerAlpha: function (year) {
      if (year === this.get("activeDate")) {
        return 1;
      } else {
        return 0;
      }
    },

    addLayerOption: function (name, imageryProvider, alpha, show) {
      var layers = this.get("imageryLayers");
      var globe = this.get("viewer").scene.globe;
      console.log(globe.imageryLayers);
      console.log(name + " is ready: " + imageryProvider.ready);
      console.log(typeof layers);
      var layer = layers.addImageryProvider(imageryProvider);
      layer.name = name;
      layer.alpha = alpha;
      layer.show = show;
    },

    setupLayers: function () {
      //Add all the decade layers for the given species and rcp
      //This will need to be refactored to allow it to be species specific
      var proxy = this.get("proxy");
      var rcp = this.get("rcp");
      var years = this.get("years");

      var speciesName = this.get("speciesName");
      console.log(speciesName);
      //Iterate through the years for each layer
      var readyCounter = 0;
      for (var i = 0; i < years.length; i++) {
        var newUrl = proxy + rcp + "/20" + years[i] + "1/" + speciesName; //Use once on the server
        var imageryProvider = this.createImageryProvider(newUrl);
        var alpha = this.setLayerAlpha(years[i]);
        var name = speciesName + "-20" + years[i] + "1";


        this.addLayerOption(name, imageryProvider, alpha, 1);
      }
    },

    addBillboard: function (x, y, title, description) {
      console.log("Adding Billboard...");
      var viewer = this.get("viewer");
      //Create the marker for the map
      var marker = viewer.entities.add({
        name: title,
        //marker position, need to account for elevation
        position: Cesium.Cartesian3.fromDegrees(x, y, 3000),
        billboard: {
          image: "assets/images/outerra-pin.png",
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1000, 1, 1500000, 0) },
        description: "<img href=" + description + "></img>",
        //currently not being recognized
        viewFrom: Cesium.Cartesian3.fromDegrees(x, y, 10000)

      });
    },
    loadPoints: function () {
      //This function will load the data for outerra points.

      // Get the Model from the Outerra controller
      var outerraModel = this.get("outerrasController").get("model");
      //Capture scope for timeout function
      var self = this;
      setTimeout(function () {
        console.log("Second try");
        //this gathers a reference to promise array that pulls the outerra records
        var content = outerraModel.get("content");
        console.log(content);

        if (content.isLoaded) {
          //For some reason there are three levels of 'content' to get to actual data
          var points = content.get("content");
          //Iterate through the returned records
          for (var x = 0, len = points.length; x < len; x++) {
            var lat = points[x].get("y");
            var lon = points[x].get("x");
            console.log("lat: " + lat + ", lon: " + lon);
            var title = points[x].get("title");
            var description = points[x].get("url");
            //Add the marker to the map
            self.addBillboard(lon, lat, title, description);
          }
        }
      }, 1000);

    },


    removeLayers: function () {
      //Clear old layers before adding new ones
      this.set("isAnimated", 0);
      console.log("Remove layers called");
      var layerLength = this.get("imageryLayers").length;
      console.log(layerLength);
      for (var i = layerLength; i > 0; i--) {
        console.log("Removing layer " + i + " out of " + this.get("years").length + " layers");
        var layer = this.get("imageryLayers").get(i);
        //console.log("Layer is "+ layer);

        this.get("imageryLayers").remove(layer);
        //console.log(this.get('imageryLayers'));
      }
    },
    //If direction is 1, it will move forward in time, else it goes backward in time
    changeYear: function (direction) {
      var active = this.get("activeDate");
      var oldLayer = this.get("imageryLayers").get(active);
      if (direction === 1) {
        if (active < this.get("years").length) {
          console.log("Moving forward in time");
          active = active + 1;
        } else {
          console.log("Moving to start");
          active = 1;
        }
      } else {
        if (active > 1) {
          console.log("Moving backward in time");
          active = active - 1;
        } else {
          console.log("Moving to end");
          active = this.get("years").length;
        }
      }
      this.set("activeDate", active);
      var newLayer = this.get("imageryLayers").get(active);
      oldLayer.alpha = 0;
      newLayer.alpha = 1;
    },



    animateMaps: function (start) {
      if (start) {
        var self = this;
        this.set("myTimer", null);
        console.log("Animating maps...");
        this.set("myTimer", setInterval(function () {
          self.changeYear(1);
          console.log("Animated");
        }, 500));
      } else {
        console.log("Stopping animation");
        clearInterval(this.get("myTimer"));
      }
    },


    changeSpecies: function () {
      this.set("speciesName", this.get("species").get("sci_name"));
      console.log("The new species is " + this.get("species").get("sci_name"));
    },
    pulseObject: function (varname) {
      $(String(varname)).removeClass("pulse");
      setTimeout(function () {
        console.log("Pulsing " + varname);
        $(String(varname)).addClass("pulse");
      }, 1);
    },

    remindSubmit: function () {
      if (this.get("selectedYear") !== null) {
        this.pulseObject("#submit-desc");
      }
    },

    createDefaultImageryViewModels: function createDefaultImageryViewModels() {
      var imageryViewModels = [];


      imageryViewModels.push(new Cesium.ProviderViewModel({
        name: "Bing Maps Aerial with Labels",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/bingAerialLabels.png"),
        tooltip: "Bing Maps aerial imagery with label overlays \nhttp://www.bing.com/maps",
        creationFunction: function () {
          return new Cesium.BingMapsImageryProvider({
            url: "//dev.virtualearth.net/",
            mapStyle: Cesium.BingMapsStyle.AERIAL_WITH_LABELS,
            errorEvent: function (e) {
              console.log("There was an error loading the tile: " + e);
            } });
        }
      }));

      imageryViewModels.push(new Cesium.ProviderViewModel({
        name: "Bing Maps Aerial",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/bingAerial.png"),
        tooltip: "Bing Maps aerial imagery \nhttp://www.bing.com/maps",
        creationFunction: function () {
          return new Cesium.BingMapsImageryProvider({
            url: "//dev.virtualearth.net/",
            mapStyle: Cesium.BingMapsStyle.AERIAL,
            errorEvent: function (e) {
              console.log("There was an error loading the tile: " + e);
            } });
        }
      }));

      imageryViewModels.push(new Cesium.ProviderViewModel({
        name: "Bing Maps Roads",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/bingRoads.png"),
        tooltip: "Bing Maps standard road maps\nhttp://www.bing.com/maps",
        creationFunction: function () {
          return new Cesium.BingMapsImageryProvider({
            url: "//dev.virtualearth.net/",
            mapStyle: Cesium.BingMapsStyle.ROAD,
            errorEvent: function (e) {
              console.log("There was an error loading the tile: " + e);
            } });
        }
      }));
      imageryViewModels.push(new Cesium.ProviderViewModel({
        name: "ESRI National Geographic",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/esriNationalGeographic.png"),
        tooltip: "    This web map contains the National Geographic World Map service. This map service is designed to be used as a general reference map     for informational and educational purposes as well as a basemap by GIS professionals and other users for creating web maps and web    mapping applications.\nhttp://www.esri.com",
        creationFunction: function () {
          return new Cesium.ArcGisMapServerImageryProvider({
            url: "//services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/"
          });
        }
      }));
      imageryViewModels.push(new Cesium.ProviderViewModel({
        name: "ESRI World Imagery",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/esriWorldImagery.png"),
        tooltip: "      World Imagery provides one meter or better satellite and aerial imagery in many parts of the world and lower resolution       satellite imagery worldwide.  The map includes NASA Blue Marble: Next Generation 500m resolution imagery at small scales       (above 1:1,000,000), i-cubed 15m eSAT imagery at medium-to-large scales (down to 1:70,000) for the world, and USGS 15m Landsat       imagery for Antarctica. The map features 0.3m resolution imagery in the continental United States and 0.6m resolution imagery in       parts of Western Europe from DigitalGlobe. In other parts of the world, 1 meter resolution imagery is available from GeoEye IKONOS,       i-cubed Nationwide Prime, Getmapping, AeroGRID, IGN Spain, and IGP Portugal.  Additionally, imagery at different resolutions has been       contributed by the GIS User Community.\nhttp://www.esri.com",
        creationFunction: function () {
          return new Cesium.ArcGisMapServerImageryProvider({
            url: "//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/Mapserver",
            errorEvent: function (e) {
              console.log("There was an error loading the tile: " + e);
            } });
        }
      }));

      imageryViewModels.push(new Cesium.ProviderViewModel({
        name: "ESRI World Street Map",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/esriWorldStreetMap.png"),
        tooltip: "      This worldwide street map presents highway-level data for the world. Street-level data includes the United States; much of       Canada; Japan; most countries in Europe; Australia and New Zealand; India; parts of South America including Argentina, Brazil,       Chile, Colombia, and Venezuela; Ghana; and parts of southern Africa including Botswana, Lesotho, Namibia, South Africa, and Swaziland.\n      http://www.esri.com",
        creationFunction: function () {
          return new Cesium.ArcGisMapServerImageryProvider({
            url: "//services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/Mapserver",
            errorEvent: function (e) {
              console.log("There was an error loading the tile: " + e);
            } });
        }
      }));

      imageryViewModels.push(new Cesium.ProviderViewModel({
        name: "Open­Street­Map",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/openStreetMap.png"),
        tooltip: "OpenStreetMap (OSM) is a collaborative project to create a free editable       map of the world.\nhttp://www.openstreetmap.org",
        creationFunction: function () {
          return new Cesium.OpenStreetMapImageryProvider({
            url: "//a.tile.openstreetmap.org/"
          });
        }
      }));

      return imageryViewModels;
    },

    createDefaultTerrainViewModels: function () {
      var terrainViewModels = [];


      terrainViewModels.push(new Cesium.ProviderViewModel({
        name: "STK World Terrain meshes",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/TerrainProviders/STK.png"),
        tooltip: "High-resolution, mesh-based terrain for the entire globe.",
        creationFunction: function () {
          return new Cesium.CesiumTerrainProvider({
            url: "//assets.agi.com/stk-terrain/world",
            requestWaterMask: true,
            requestVertexNormals: true
          });
        }
      }));
      return terrainViewModels;
    },


    actions: {
      reloadLayers: function () {
        this.removeLayers();
        //this.changeSpecies();
        this.setupLayers();
      },

      plusYear: function () {
        this.changeYear(1);
      },
      minusYear: function () {
        this.changeYear(0);
      },

      setWorstRcp: function () {
        this.set("rcp", "rcp85");
      },
      setBestRcp: function () {
        this.set("rcp", "rcp26");
      },
      getEntity: function () {},
      playPause: function () {
        if (this.get("isAnimated")) {
          console.log("Stopping animation");
          this.set("isAnimated", 0);
        } else {
          console.log("Starting animation");
          this.set("isAnimated", 1);
        }
      } }
  });

});
define('ffdm-frontend/controllers/charts', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].ArrayController.extend({
    sortProperties: ["plant"],
    sortAscending: true
  });

});
define('ffdm-frontend/controllers/headlines', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].ArrayController.extend({
    sortProperties: ["orderId"],
    sortAscending: true,
    previousScroll: $(window).scrollTop(),
    classArray: [],
    classCounter: 0,


    comparePos: function (id, pos) {
      console.log("comparePos called");

      var divSize = $(id).height();
      var divTop = pos;
      var divBottom = divTop + divSize;
      var windowTop = $(window).scrollTop();
      var windowSize = window.innerHeight;
      var windowBottom = windowTop + windowSize;
      var scrollView = divSize * 0.8;
      console.log("Top: " + windowTop + ", Bottom: " + windowBottom);
      var divId = id + "-scroll";
      if (divTop + scrollView > windowTop && divBottom - scrollView < windowBottom) {
        $(divId).addClass("right-nav-active");
      } else {
        $(divId).removeClass("right-nav-active");
      }
    },

    logId: function (elem, idx, arr) {


      var id = "#" + elem;
      var pos = $(id).offset().top;
      var tuple = [];

      tuple = [id, pos];
      this.comparePos(id, pos);
      //console.log(idx);
      //console.log(tuple);
      return tuple;
    },
    getPositions: function () {
      console.log("getPositions called");
      var arr = this.get("classArray");
      var classList = [];
      arr.forEach(this.logId, this);


      return arr;
    },

    highlightFirstDot: function () {
      var activeDot = this.get("classArray")[0];
      var activeDotId = "#" + activeDot + "-scroll";
      console.log("Active dot id is: ");
      console.log($(activeDotId));
      console.log("Does this exist? " + $(activeDotId).length);
      console.log($(activeDotId).hasClass("right-nav-active"));
      if ($(activeDotId).hasClass("right-nav-active") === false) {
        console.log("Adding right-nav-active class...");
        $(activeDotId).addClass("right-nav-active");
      }

      console.log(activeDotId + " has active class: " + $(activeDotId).hasClass("right-nav-active"));
    },
    modelDidChange: (function () {
      console.info(this.get("model").type);
      console.log("Setting classArray");
      console.log(this.get("model").sortBy("orderId"));
      this.set("classArray", this.get("model").sortBy("orderId").mapBy("classId"));
      console.log(this.get("classArray"));
      this.set("classCounter", 0);
      var _this = this;
      //THIS IS A HACK THAT SHOULD PROBABLY BE DONE MORE ELEGANTLY IN FUTURE
      //highlightFirstDot will only work with a timer of 0

      setTimeout(function () {
        console.log("Hello, Timer");
        console.log(_this);
        _this.highlightFirstDot();
      }, 0);
    }).observes("model.isLoaded"),
    bindScrolling: function (opts) {
      var onScroll,
          _this = this;
      //opts = opts || {debounce: 100};

      console.log("highlightFirstDot - timer");


      this.highlightFirstDot();
      onScroll = function () {
        //return _this.scrolled();
        return _this.debounce(_this.headlineScrolled(), 2000);
      };
      $(document).bind("touchmove", onScroll);
      $(window).bind("scroll", onScroll);
    },
    scrolled: function () {
      console.log("MapsController was scrolled");
      console.log($(window).scrollTop());
    },

    debounce: function (func, wait, immediate) {
      var timeout;
      return function () {
        var context = this,
            args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          timeout = null;
          if (!immediate) {
            func.apply(context, args);
          }
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
      };
    },
    headlineScrolled: function () {
      this.getPositions();
      //console.log(elems);
    },


    actions: {

      toggleDetail: function (detail) {
        console.log("openDetail called.");
        console.log(detail);

        var detailId = "#" + detail;
        var headline = detailId.substring(0, detailId.length - 7);
        console.log(headline);
        console.log($(detailId).css("max-height"));
        $(detailId).css("max-height", $(detailId).css("max-height") === "0px" ? "3600px" : "0px");
        if ($(detailId).css("max-height") === "0px") {
          $("body").scrollTo($(detailId).offset().top - 120, { duration: "slow", offsetTop: "200", easing: "swing" });
        } else {
          $("body").scrollTo($(headline), { duration: "slow", easing: "swing" });
        }
      },

      scrollToHeadline: function (headline) {
        console.log("scrollToHeadline called.");
        console.log(headline);
        var headlineId = "#" + headline;
        var scrollId = headlineId + "-scroll";
        console.log("ScrollId is " + scrollId);
        $("body").scrollTo($(headlineId), 1200, { easing: "swing" });
        $(scrollId).addClass("active");

      },

      getChart: function (chart) {
        console.log("GetChart called");
        var pictureUrl = chart.get("pictureUrl");
        var figureUrl = chart.get("figureUrl");
        var pictureContainer = "#" + chart.get("headline").get("pictureContainer");
        var chartContainer = "#" + chart.get("headline").get("chartContainer");
        console.log(pictureContainer + " will have " + pictureUrl);
        console.log(chartContainer + " will have " + chartContainer);
        $(pictureContainer).attr("src", pictureUrl);
        $(chartContainer).attr("src", figureUrl);
      },

      getMountain: function (mountain) {
        console.log("GetMountain called");
        var mountainUrl = mountain.get("mountainUrl");
        var mountainContainer = "#" + mountain.get("headline").get("mountainContainer");
        console.log(mountainContainer + " will have " + mountainUrl);
        $(mountainContainer).attr("src", mountainUrl);
      }

    }
  });

});
define('ffdm-frontend/controllers/mountain', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    sortProperties: ["mountain"],
    sortAscending: true
  });

});
define('ffdm-frontend/controllers/outerras', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].ArrayController.extend({});

});
define('ffdm-frontend/controllers/plants', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].ArrayController.extend({
    sortProperties: ["name"],
    sortAscending: true
  });

});
define('ffdm-frontend/helpers/fa-icon', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var FA_PREFIX = /^fa\-.+/;

  var warn = Ember['default'].Logger.warn;

  /**
   * Handlebars helper for generating HTML that renders a FontAwesome icon.
   *
   * @param  {String} name    The icon name. Note that the `fa-` prefix is optional.
   *                          For example, you can pass in either `fa-camera` or just `camera`.
   * @param  {Object} options Options passed to helper.
   * @return {Ember.Handlebars.SafeString} The HTML markup.
   */
  var faIcon = function (name, options) {
    if (Ember['default'].typeOf(name) !== "string") {
      var message = "fa-icon: no icon specified";
      warn(message);
      return Ember['default'].String.htmlSafe(message);
    }

    var params = options.hash,
        classNames = [],
        html = "";

    classNames.push("fa");
    if (!name.match(FA_PREFIX)) {
      name = "fa-" + name;
    }
    classNames.push(name);
    if (params.spin) {
      classNames.push("fa-spin");
    }
    if (params.flip) {
      classNames.push("fa-flip-" + params.flip);
    }
    if (params.rotate) {
      classNames.push("fa-rotate-" + params.rotate);
    }
    if (params.lg) {
      warn("fa-icon: the 'lg' parameter is deprecated. Use 'size' instead. I.e. {{fa-icon size=\"lg\"}}");
      classNames.push("fa-lg");
    }
    if (params.x) {
      warn("fa-icon: the 'x' parameter is deprecated. Use 'size' instead. I.e. {{fa-icon size=\"" + params.x + "\"}}");
      classNames.push("fa-" + params.x + "x");
    }
    if (params.size) {
      if (Ember['default'].typeOf(params.size) === "string" && params.size.match(/\d+/)) {
        params.size = Number(params.size);
      }
      if (Ember['default'].typeOf(params.size) === "number") {
        classNames.push("fa-" + params.size + "x");
      } else {
        classNames.push("fa-" + params.size);
      }
    }
    if (params.fixedWidth) {
      classNames.push("fa-fw");
    }
    if (params.listItem) {
      classNames.push("fa-li");
    }
    if (params.pull) {
      classNames.push("pull-" + params.pull);
    }
    if (params.border) {
      classNames.push("fa-border");
    }
    if (params.classNames && !Ember['default'].isArray(params.classNames)) {
      params.classNames = [params.classNames];
    }
    if (!Ember['default'].isEmpty(params.classNames)) {
      Array.prototype.push.apply(classNames, params.classNames);
    }


    html += "<";
    var tagName = params.tagName || "i";
    html += tagName;
    html += " class='" + classNames.join(" ") + "'";
    if (params.title) {
      html += " title='" + params.title + "'";
    }
    if (params.ariaHidden === undefined || params.ariaHidden) {
      html += " aria-hidden=\"true\"";
    }
    html += "></" + tagName + ">";
    return Ember['default'].String.htmlSafe(html);
  };

  exports['default'] = Ember['default'].Handlebars.makeBoundHelper(faIcon);

  exports.faIcon = faIcon;

});
define('ffdm-frontend/initializers/export-application-global', ['exports', 'ember', 'ffdm-frontend/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
    var classifiedName = Ember['default'].String.classify(config['default'].modulePrefix);

    if (config['default'].exportApplicationGlobal && !window[classifiedName]) {
      window[classifiedName] = application;
    }
  };

  exports['default'] = {
    name: "export-application-global",

    initialize: initialize
  };

});
define('ffdm-frontend/models/chart', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    plant: DS['default'].belongsTo("plant", { async: true }),
    pictureUrl: DS['default'].attr("string"),
    figureUrl: DS['default'].attr("string"),
    headline: DS['default'].belongsTo("headline", { async: true }),
    createdAt: DS['default'].attr(),
    updatedAt: DS['default'].attr()
  });

});
define('ffdm-frontend/models/headline', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    title: DS['default'].attr("string"),
    classId: DS['default'].attr("string"),
    orderId: DS['default'].attr("string"),
    pageId: DS['default'].attr("string"),
    detail: DS['default'].attr("string"),
    charts: DS['default'].hasMany("chart", { async: true }),
    mountains: DS['default'].hasMany("mountain", { async: true }),
    down: DS['default'].attr("boolean"),
    createdAt: DS['default'].attr(),
    updatedAt: DS['default'].attr(),


    detailId: (function () {
      return this.get("classId") + "-detail";
    }).property("classId"),

    scrollId: (function () {
      return this.get("classId") + "-scroll";
    }).property("scrollId"),

    chartContainer: (function () {
      return this.get("classId") + "-chart";
    }).property("classId"),

    pictureContainer: (function () {
      return this.get("classId") + "-picture";
    }).property("classId"),

    mountainContainer: (function () {
      return this.get("classId") + "-mountain";
    }).property("classId")


  });

});
define('ffdm-frontend/models/mountain', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    mountain: DS['default'].belongsTo("mountain", { async: true }),
    name: DS['default'].attr(),
    mountainUrl: DS['default'].attr("string"),
    headline: DS['default'].belongsTo("headline", { async: true }),
    createdAt: DS['default'].attr(),
    updatedAt: DS['default'].attr()
  });

});
define('ffdm-frontend/models/outerra', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    title: DS['default'].attr("string"),
    url: DS['default'].attr("string"),
    x: DS['default'].attr("number"),
    y: DS['default'].attr("number"),
    tilt: DS['default'].attr("number"),
    heading: DS['default'].attr("number"),
    createdAt: DS['default'].attr("date"),
    updatedAt: DS['default'].attr("date")
  });

});
define('ffdm-frontend/models/plant', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    name: DS['default'].attr("string"),
    sci_name: DS['default'].attr("string"),
    createdAt: DS['default'].attr(),
    updatedAt: DS['default'].attr(),
    charts: DS['default'].hasMany("chart", { async: true })

  });

});
define('ffdm-frontend/router', ['exports', 'ember', 'ffdm-frontend/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  Router.map(function () {
    //  this.route("welcome", { path: "/"});
    this.route("welcome");
    this.route("cesium", { path: "/" });
    this.route("cesium");
    this.route("plants");
    this.resource("headlines", { path: "/headlines/:pageId" });
    this.route("carousel");
  });

  exports['default'] = Router;

});
define('ffdm-frontend/routes/application', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    //this is modal
    actions: {
      showModal: function (name, model) {
        this.render(name, {
          into: "application",
          outlet: "modal",
          model: model
        });
      },
      removeModal: function () {
        this.disconnectOutlet({
          outlet: "modal",
          parentView: "application"
        });
      }
    }

  });

});
define('ffdm-frontend/routes/carousel', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({});

});
define('ffdm-frontend/routes/cesium', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    setupController: function (controller, model) {
      this._super(controller, model);
      this.controllerFor("plants").set("content", this.store.find("plant"));
      this.controllerFor("outerras").set("content", this.store.find("outerra"));
    }
  });

});
define('ffdm-frontend/routes/headlines', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function (params) {
      console.log("Headlines route hit with parameter: " + params.pageId);
      return this.get("store").find("headline", { pageId: params.pageId });
    },
    render: function () {
      console.log("activate-function");
      this._super();
      window.scrollTo(0, 120);
    }
  });

});
define('ffdm-frontend/routes/plants', ['exports', 'ember', 'ember-data'], function (exports, Ember, DS) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function () {
      return this.store.find("plant");
    }
  });

});
define('ffdm-frontend/routes/welcome', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({});

});
define('ffdm-frontend/templates/application', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, helper, options, self=this, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;

  function program1(depth0,data) {
    
    
    data.buffer.push("<div class=\"logo-globe\"></div>");
    }

  function program3(depth0,data) {
    
    
    data.buffer.push("Forest Forecasts");
    }

  function program5(depth0,data) {
    
    
    data.buffer.push("About");
    }

  function program7(depth0,data) {
    
    
    data.buffer.push("Methods");
    }

  function program9(depth0,data) {
    
    
    data.buffer.push(" Forest<br> Change");
    }

  function program11(depth0,data) {
    
    
    data.buffer.push("Forest<br> Loss");
    }

  function program13(depth0,data) {
    
    
    data.buffer.push("Lost<br> Services");
    }

    data.buffer.push("<nav class=\"navbar navbar-simple navbar-fixed-top\">\n  <div class=\"container-fluid full\">\n    <!-- Brand and toggle get grouped for better mobile display -->\n    \n\n<!-- left col -->\n    <div id=\"header-left\">\n\n      <div class=\"navbar-header navbar-ffdm-header\">\n        <button type=\"button\" class=\"navbar-toggle collapsed\" data-toggle=\"collapse\" data-target=\"#bs-example-navbar-collapse-1\">\n          <span class=\"sr-only\">Toggle navigation</span>\n          <span class=\"icon-bar\"></span>\n          <span class=\"icon-bar\"></span>\n          <span class=\"icon-bar\"></span>\n        </button>\n      ");
    stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
      'tagName': ("a"),
      'class': ("navbar-brand")
    },hashTypes:{'tagName': "STRING",'class': "STRING"},hashContexts:{'tagName': depth0,'class': depth0},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "cesium", options) : helperMissing.call(depth0, "link-to", "cesium", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push(" \n\n    <!-- responsive -->\n\n              </div>\n            <!-- Collect the nav links, forms, and other content for toggling -->\n      <div id=\"navContainer\" class=\"\" id=\"bs-example-navbar-collapse-1\">\n        <ul class=\"nav navbar-nav\">\n          ");
    stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
      'tagName': ("li"),
      'class': ("navbar-brand")
    },hashTypes:{'tagName': "STRING",'class': "STRING"},hashContexts:{'tagName': depth0,'class': depth0},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "cesium", options) : helperMissing.call(depth0, "link-to", "cesium", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push(" \n     \n     <div class=\"navbar-brand-sub\">\n                <span>");
    stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
      'tagName': ("button"),
      'class': ("app-button")
    },hashTypes:{'tagName': "STRING",'class': "STRING"},hashContexts:{'tagName': depth0,'class': depth0},inverse:self.noop,fn:self.program(5, program5, data),contexts:[depth0,depth0],types:["STRING","STRING"],data:data},helper ? helper.call(depth0, "headlines", "about", options) : helperMissing.call(depth0, "link-to", "headlines", "about", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("</span><span>");
    stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
      'tagName': ("button"),
      'class': ("app-button")
    },hashTypes:{'tagName': "STRING",'class': "STRING"},hashContexts:{'tagName': depth0,'class': depth0},inverse:self.noop,fn:self.program(7, program7, data),contexts:[depth0,depth0],types:["STRING","STRING"],data:data},helper ? helper.call(depth0, "headlines", "methods", options) : helperMissing.call(depth0, "link-to", "headlines", "methods", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("</span>\n      </div>\n\n        </ul>\n        \n        \n      </div>\n      </div><!--/header-left-->\n\n<!-- mid col -->\n\n	<div id=\"header-mid\">\n		<span class=\"heading-wide\">Visualizing forest change in the Western United States</span>\n		<span class=\"heading-slim\">Visualizing forest change in<br/> the Western United States</span>\n	</div>\n		\n \n<!-- right col -->\n     <div id=\"header-right\">\n      <div id=\"breadcrumbs\" class=\"collapse navbar-collapse\" id=\"bs-example-navbar-collapse-1\">\n      <ul class=\"nav navbar-nav navbar-right\">\n      ");
    stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
      'tagName': ("li")
    },hashTypes:{'tagName': "STRING"},hashContexts:{'tagName': depth0},inverse:self.noop,fn:self.program(9, program9, data),contexts:[depth0,depth0],types:["STRING","STRING"],data:data},helper ? helper.call(depth0, "headlines", "climate", options) : helperMissing.call(depth0, "link-to", "headlines", "climate", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n      ");
    stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
      'tagName': ("li")
    },hashTypes:{'tagName': "STRING"},hashContexts:{'tagName': depth0},inverse:self.noop,fn:self.program(11, program11, data),contexts:[depth0,depth0],types:["STRING","STRING"],data:data},helper ? helper.call(depth0, "headlines", "forest", options) : helperMissing.call(depth0, "link-to", "headlines", "forest", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n      ");
    stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
      'tagName': ("li")
    },hashTypes:{'tagName': "STRING"},hashContexts:{'tagName': depth0},inverse:self.noop,fn:self.program(13, program13, data),contexts:[depth0,depth0],types:["STRING","STRING"],data:data},helper ? helper.call(depth0, "headlines", "lost", options) : helperMissing.call(depth0, "link-to", "headlines", "lost", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n      </ul>\n      </div><!-- /.navbar-collapse -->\n      </div><!-- /header-right-->\n\n\n  </div>\n</nav>\n\n\n");
    stack1 = helpers._triageMustache.call(depth0, "outlet", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n");
    data.buffer.push(escapeExpression((helper = helpers.outlet || (depth0 && depth0.outlet),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "modal", options) : helperMissing.call(depth0, "outlet", "modal", options))));
    data.buffer.push("\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/carousel', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

  function program1(depth0,data) {
    
    
    data.buffer.push("<div class=\"bc-gif-example\"></div>");
    }

    data.buffer.push("<div class=\"bc-play-pause\">\n<div id=\"carouselButtons\">\n<button ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "bcPlay", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(" id=\"playButton\" type=\"button\" class=\"btn btn-default\">\n<span class=\"fa fa-play\"></span>\n</button>\n<button ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "bcPause", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(" id=\"pauseButton\" type=\"button\" class=\"btn btn-default\">\n<span class=\"fa fa-pause\"></span>\n</button>\n</div>\n</div>\n\n<div id=\"carousel-example-generic\" class=\"carousel slide\" data-ride=\"carousel\" data-interval=\"4000\">\n  <!-- Indicators -->\n  <ol class=\"carousel-indicators\">\n    <li data-target=\"#carousel-example-generic\" data-slide-to=\"0\" class=\"bc-icon bc-1-icon\"></li>\n    <li data-target=\"#carousel-example-generic\" data-slide-to=\"1\" class=\"active bc-icon bc-2-icon\"></li>\n    <li data-target=\"#carousel-example-generic\" data-slide-to=\"2\" class=\"bc-icon bc-3-icon\"></li>\n  </ol>\n\n  <!-- Wrapper for slides -->\n  <div class=\"carousel-inner\" role=\"listbox\">\n    <div class=\"item\">\n      <div id=\"bc-1\" class=\"bc-slider-height\"></div>\n      <div class=\"bc-caption-top\">\n        <div class=\"bc-img-example\"></div>\n        Sed no viris vidisse, eam ex rebum inimicus consequat. Nihil efficiantur has cu, inani euismod dolorem has et. Nusquam fierent scaevola mel cu. Graeci aliquip reprehendunt ei qui, justo cetero cum at.\n      </div>\n      <div class=\"bc-caption-bottom\">\n      Lorem ipsum dolor sit amet, enim nullam complectitur ad vel, brute debet eum ea. Qui scaevola sadipscing no. Ut animal eripuit qui. Ei mel inani simul laudem, no pri civibus sapientem.<br>Pri iisque inermis in. Ne nec utroque albucius, hinc intellegebat id nam. An vel amet nostro, latine definitionem nam eu. Eu postulant referrentur necessitatibus cum, purto reformidans at sed, veri nostrud democritum quo ne.\n      </div>\n    </div>\n\n    <div class=\"item active\">\n      <div id=\"bc-2\" class=\"bc-slider-height\"></div>\n      <div class=\"bc-caption-bottom\">\n      Has id detracto persequeris definitiones, pri an falli repudiare. Sit quot minimum an, id vix erat euripidis. Ius voluptaria dissentiunt ea, ex maiorum alienum pri, an has vidit probo. Ex porro ridens accumsan mei, id solum patrioque sententiae has. Veri commodo gloriatur eu est, zril viderer apeirian sea no.\n      </div>\n    </div>\n    <div class=\"item\">\n      <div id=\"bc-3\" class=\"bc-slider-height\"></div>\n      <div class=\"bc-caption-top\">\n      Sit et saepe debitis ullamcorper. Dicat essent quaerendum in eum. Ei ius meliore vivendo prodesset, has ut causae honestatis. Ex nec modo corrumpit, ne pro dicat discere alienum.\n            ");
    stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "cesium", options) : helperMissing.call(depth0, "link-to", "cesium", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n      </div>\n      <div class=\"bc-caption-bottom\">\n      Falli qualisque nam id, ex vis elitr nostrum hendrerit. Clita aliquip intellegam vel ex. Dicat augue nostro in sit. Vel brute vocent in, porro ponderum ea nec, ad mel blandit nominati.\n      </div>\n    </div>\n  </div>\n\n  <!-- Controls -->\n  <a class=\"left carousel-control\" href=\"#carousel-example-generic\" role=\"button\" data-slide=\"prev\">\n    <span id=\"bc-carousel-control\" class=\"fa fa-chevron-left fa-5x\" aria-hidden=\"true\"></span>\n    <span class=\"sr-only\">Previous</span>\n  </a>\n  <a class=\"right carousel-control\" href=\"#carousel-example-generic\" role=\"button\" data-slide=\"next\">\n    <span id=\"bc-carousel-control\" class=\"fa fa-chevron-right fa-5x\" aria-hidden=\"true\"></span>\n    <span class=\"sr-only\">Next</span>\n  </a>\n</div>\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/cesium', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', helper, options, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


    data.buffer.push("<!-- begin cesium -->\n\n<div id=\"cesium-main\" data-video=\"http://player.vimeo.com/external/97766233.sd.mp4?s=5df211c4da525ce8da33fddd981d52df\">\n  <div id=\"cesium-submain\" class=\"full-height map-overlap\">\n\n    <div class=\"row cesium-top-margin\"></div>\n\n    <div id=\"cesium-left-col\" class=\"col-md-3 full-height\">\n<!--      <div class=\"form-horizontal span8\">-->\n      <div id=\"select-group\">\n        <div id=\"plant-desc\" class=\"map-step\">\n          Step 1: Choose a species\n          <button class=\"cesium-modal-button\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "showModal", "maptip1-modal", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","STRING"],data:data})));
    data.buffer.push(">?</button>\n          \n        </div> \n        <p><hr class=\"maps-hr\"></p>\n        <div class=\"form-group form-group-1\">\n          <div class=\"controls\">\n            ");
    data.buffer.push(escapeExpression(helpers.view.call(depth0, "select", {hash:{
      'id': ("plantSelect"),
      'contentBinding': ("controllers.plants.arrangedContent"),
      'optionValuePath': ("content.sci_name"),
      'optionLabelPath': ("content.name"),
      'selectionBinding': ("controller.species"),
      'prompt': ("Aspen, Quaking")
    },hashTypes:{'id': "STRING",'contentBinding': "STRING",'optionValuePath': "STRING",'optionLabelPath': "STRING",'selectionBinding': "STRING",'prompt': "STRING"},hashContexts:{'id': depth0,'contentBinding': depth0,'optionValuePath': depth0,'optionLabelPath': depth0,'selectionBinding': depth0,'prompt': depth0},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push("\n          </div>\n        </div>\n      </div>\n      <div id=\"rcp-group\" class=\"rcp-toolbar btn-group rcp-group-toolbar\">\n        <div id=\"rcp-desc\" class=\"map-step\">\n          Step 2: Choose a Climate Scenario\n          <button class=\"cesium-modal-button\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "showModal", "maptip2-modal", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","STRING"],data:data})));
    data.buffer.push(">?</button>\n            \n            <p><hr class=\"maps-hr\"></p>\n            <div class=\"btn-row\">\n              <div id=\"rcp26-label\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "setBestRcp", "0", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","STRING"],data:data})));
    data.buffer.push(" class=\"col-sm-6 btn-temp active-label\">\n                \n                <label class=\"rcp-label\" for=\"best-case\">\n                  <div class=\"best-case-label\"></div>\n                  Best Case\n                </label>\n              </div>\n              <div id=\"rcp85-label\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "setWorstRcp", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data})));
    data.buffer.push(" class=\"col-sm-6 btn-temp\">\n                \n                <label class=\"rcp-label\" for=\"worst-case\">\n                  <div class=\"worst-case-label\"></div>\n                  Worst Case\n                </label>\n              </div>\n            </div>\n        </div>\n      </div>\n\n        <div id=\"submit-group\" class=\"form-group map-step\">\n         <p id=\"submit-desc\" class=\"map-step\">\n           Step 3: Get the forest forecasts\n         </p>\n         <hr class=\"maps-hr\">\n         <p></p>\n         <div id=\"get-map-container\">\n          <div id=\"get-map\">\n            <button type=\"submit\" id=\"map-submit\" class=\"btn btn-map\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "reloadLayers", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(">\n              Load it!\n              <i class=\"spinner\">\n                <div class=\"glyphicon glyphicon-refresh\">\n                </div>\n              </i>\n              <span class=\"arrow\">\n                <i class=\"glyphicon glyphicon-arrow-right\">\n                </i>\n              </span>\n            </button>\n          </div> <!-- get-map-container -->\n        </div> <!--submit-group -->\n       </div>\n\n\n        <!-- year on top, controls on bottom -->\n        <div id=\"year-group\" class=\"form-group btn-group year-group-large\">\n          <p id=\"year-desc\" class=\"map-step\" class=\"year-desc-3\">\n           Step 4: Animate the future forest\n            <hr class=\"maps-hr\">\n          </p>\n          <div id=\"year-field-container\" class=\"col-sm-12\">\n            ");
    data.buffer.push(escapeExpression(helpers.view.call(depth0, "Ember.TextField", {hash:{
      'valueBinding': ("controller.year"),
      'class': ("year-field")
    },hashTypes:{'valueBinding': "STRING",'class': "STRING"},hashContexts:{'valueBinding': depth0,'class': depth0},contexts:[depth0],types:["ID"],data:data})));
    data.buffer.push("\n          </div>\n          <div id=\"year-controls-container\" class=\"col-sm-12\">\n            <div class=\"minus-container col-sm-3\">\n              <button id=\"minusYear\" class=\"btn-control\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "minusYear", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(">");
    data.buffer.push(escapeExpression((helper = helpers['fa-icon'] || (depth0 && depth0['fa-icon']),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "minus", options) : helperMissing.call(depth0, "fa-icon", "minus", options))));
    data.buffer.push("</button>\n            </div>\n            <div class=\"play-container col-sm-6\">\n              <button id=\"playPause\" class=\"btn-control fa fa-play\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "playPause", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push("></button> \n            </div>\n            <div class=\"plus-container col-sm-3\">\n              <button id=\"plusYear\" class=\"btn-control\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "plusYear", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(">");
    data.buffer.push(escapeExpression((helper = helpers['fa-icon'] || (depth0 && depth0['fa-icon']),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "plus", options) : helperMissing.call(depth0, "fa-icon", "plus", options))));
    data.buffer.push("</button>\n            </div>\n          </div>\n\n        </div><!-- end year-group; year on top, controls on bottom -->\n\n        <!-- year-group-- year and controls one row -->\n    \n<div id=\"year-group\" class=\"form-group btn-group year-group-tablet\">\n          <p id=\"year-desc\" class=\"map-step\" class=\"year-desc-3\">\n           Step 4: Animate the future forest\n            <hr class=\"maps-hr\">\n          </p>\n          <div class=\"row col-sm-12 year-tablet-container\">\n\n          <div id=\"year-field-container\" class=\"year-tablet-left\">\n            ");
    data.buffer.push(escapeExpression(helpers.view.call(depth0, "Ember.TextField", {hash:{
      'valueBinding': ("controller.year"),
      'class': ("year-field")
    },hashTypes:{'valueBinding': "STRING",'class': "STRING"},hashContexts:{'valueBinding': depth0,'class': depth0},contexts:[depth0],types:["ID"],data:data})));
    data.buffer.push("\n          </div>\n\n         <!-- <div id=\"year-controls-container\" class=\"col-sm-3\">-->\n          <div class=\"year-tablet-right\">\n            <div class=\"minus-container\">\n              <button id=\"minusYear\" class=\"btn-control\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "minusYear", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(">");
    data.buffer.push(escapeExpression((helper = helpers['fa-icon'] || (depth0 && depth0['fa-icon']),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "minus", options) : helperMissing.call(depth0, "fa-icon", "minus", options))));
    data.buffer.push("</button>\n            </div>\n\n            <div class=\"play-container\">\n              <button id=\"playPause\" class=\"btn-control fa fa-play\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "playPause", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push("></button> \n            </div>\n\n            <div class=\"plus-container\">\n              <button id=\"plusYear\" class=\"btn-control\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "plusYear", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(">");
    data.buffer.push(escapeExpression((helper = helpers['fa-icon'] || (depth0 && depth0['fa-icon']),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "plus", options) : helperMissing.call(depth0, "fa-icon", "plus", options))));
    data.buffer.push("</button>\n            </div>\n          </div>\n         <!-- </div>-->\n        </div>\n\n        </div>\n\n       <!-- end year-group-- year and controls one row --> \n        <div class=\"row bottom-row-tablet\">\n        <div id=\"map-legend\" class=\"map-legend-tablet\">\n          <h3>Likelihood of<br>Species Presence <button class=\"cesium-modal-button\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "showModal", "maptip3-modal", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","STRING"],data:data})));
    data.buffer.push(">?</button></h3>\n          <hr class=\"maps-hr\"> \n          <div class=\"map-legend-sub\">\n            <div id=\"suitability-circles\">\n              <div class=\"row\">\n                <div class=\"oval-high\">High</div>\n              </div>\n              <div class=\"row\">\n                <div class=\"oval-mid\">Medium</div>\n              </div>\n              <div class=\"row\">\n                <div class=\"oval-low\">Low</div>\n              </div>\n            </div> <!-- suitability-circles -->\n\n          </div> <!-- map-legend-sub -->\n        </div> <!-- map-legend for tablet -->\n        <div class=\"credits-container credits-container-tablet\">\n	        <span>Powered by:</span>\n	        <a href=\"https://www.aspennature.org/\" target=\"_blank\"><div class=\"cesium-aces\"></div></a>\n          <a href=\"http://bien.nceas.ucsb.edu/bien/\" target=\"_blank\"><div class=\"cesium-bien\"></div></a>\n	        <div class=\"cesium-ua\"></div>\n	      </div> <!-- cesium credits tablet -->\n        </div> <!-- /row -->\n\n      \n\n      </div> <!-- cesium-left-col-->\n\n      <div id=\"cesium-mid-col\" class=\"col-md-1 full-height\">\n        <div id=\"map-legend\">\n          <h3>Likelihood of<br>Species Presence <button class=\"cesium-modal-button\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "showModal", "maptip3-modal", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","STRING"],data:data})));
    data.buffer.push(">?</button></h3>\n          <hr class=\"maps-hr\"> \n          <div class=\"map-legend-sub\">\n           \n            <div id=\"suitability-circles\">\n              <div class=\"row\">\n                <div class=\"oval-high\">High</div>\n              </div>\n              <div class=\"row\">\n                <div class=\"oval-mid\">Medium</div>\n              </div>\n              <div class=\"row\">\n                <div class=\"oval-low\">Low</div>\n              </div>\n            </div> <!-- suitability-circles -->\n\n          </div> <!-- map-legend-sub -->\n        </div> <!-- map-legend -->\n	<div class=\"credits-container\">\n	  <span>Powered by:</span>\n	  <a href=\"https://www.aspennature.org/\" target=\"_blank\"><div class=\"cesium-aces\"></div></a>\n    <a href=\"http://bien.nceas.ucsb.edu/bien/\" target=\"_blank\"><div class=\"cesium-bien\"></div></a>\n\n	  <div class=\"cesium-ua\"></div>\n	</div>\n      </div> <!-- cesium-mid-col-->\n\n      <div id=\"cesium-right-col\" class=\"col-md-8 full-height\">\n        <div id=\"cesiumViewContainer\" class=\"container full-hw\">\n          <div id=\"cesiumContainer\"> \n            <div id=\"baseLayerPickerContainer\" style=\"position:absolute;top:124px;right:376px;width:38px;height:38px;z-index:100;\"></div>\n          </div><!-- cesiumContainer -->\n        </div><!-- cesiumViewContainer -->\n      </div><!--cesium-right-col -->\n\n    </div>\n  </div> <!-- cesium--submain -->\n</div> <!-- cesium-main-->\n\n\n<!-- begin instructions modal -->\n\n<div class=\"modal fade\" id=\"instructions\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\">\n  <div class=\"modal-dialog modal-instr-dialog\">\n    <div class=\"modal-content modal-instructions\">\n      <div class=\"modal-header instr-modal-header\">\n                <span class=\"modal-title instr-modal-title\" id=\"myModalLabel\">Oops... we can't find WebGL</span> <span class=\"instr-help cesium-navigationHelpButton-wrapper\"><div class=\"cesium-button cesium-toolbar-button cesium-navigation-help-button\"><svg viewBox=\"0 0 32 32\" height=\"32\" width=\"32\" class=\"cesium-svgPath-svg\"><path d=\"M16,1.466C7.973,1.466,1.466,7.973,1.466,16c0,8.027,6.507,14.534,14.534,14.534c8.027,0,14.534-6.507,14.534-14.534C30.534,7.973,24.027,1.466,16,1.466z M17.328,24.371h-2.707v-2.596h2.707V24.371zM17.328,19.003v0.858h-2.707v-1.057c0-3.19,3.63-3.696,3.63-5.963c0-1.034-0.924-1.826-2.134-1.826c-1.254,0-2.354,0.924-2.354,0.924l-1.541-1.915c0,0,1.519-1.584,4.137-1.584c2.487,0,4.796,1.54,4.796,4.136C21.156,16.208,17.328,16.627,17.328,19.003z\"></path></svg></div></span>\n<button type=\"button\" class=\"close instr-close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n\n      </div>\n      <div class=\"modal-body\">\n\n      <h2>This site requires WebGL and it looks like your browser does not have it enabled.</h2>\n      <p>To enable WebGL, please follow the instructions <a href=\"http://www.browserleaks.com/webgl#howto-enable-disable-webgl\">HERE</a></p>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-primary\" data-dismiss=\"modal\">\n        Close\n      </button>\n    </div>\n  </div>\n</div>\n</div>\n<!-- / modal instructions -->\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/components/popup-modal', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, escapeExpression=this.escapeExpression;


    data.buffer.push("<div class=\"modal fade\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-contents\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n        <h4 class=\"modal-title\">");
    stack1 = helpers._triageMustache.call(depth0, "title", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("</h4>\n      </div>\n      <div class=\"modal-body\">\n        ");
    stack1 = helpers._triageMustache.call(depth0, "yield", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n      </div>\n      <div class=\"modal-footer\">\n        \n        <button type=\"button\" class=\"btn btn-primary\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "ok", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(">OK</button>\n      </div>\n    </div>\n  </div>\n</div>\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/components/x-toggle', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

  function program1(depth0,data) {
    
    var buffer = '', stack1;
    data.buffer.push("\n	<span  ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'class': (":toggle-text :toggle-prefix size")
    },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(">\n		");
    stack1 = helpers._triageMustache.call(depth0, "offLabel", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n	</span>\n");
    return buffer;
    }

  function program3(depth0,data) {
    
    var buffer = '', stack1;
    data.buffer.push("\n	<span ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'class': (":toggle-text :toggle-postfix size")
    },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(">\n		");
    stack1 = helpers._triageMustache.call(depth0, "onLabel", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n	</span>\n");
    return buffer;
    }

    stack1 = helpers['if'].call(depth0, "showLabels", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n");
    data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
      'id': ("forId"),
      'type': ("checkbox"),
      'checked': ("toggled"),
      'class': ("x-toggle"),
      'disabled': ("disabled")
    },hashTypes:{'id': "ID",'type': "STRING",'checked': "ID",'class': "STRING",'disabled': "ID"},hashContexts:{'id': depth0,'type': depth0,'checked': depth0,'class': depth0,'disabled': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
    data.buffer.push("\n<label ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'class': (":x-toggle-btn themeClass size disabled:x-toggle-disabled"),
      'for': ("forId"),
      'data-tg-off': ("offLabel"),
      'data-tg-on': ("onLabel")
    },hashTypes:{'class': "STRING",'for': "ID",'data-tg-off': "ID",'data-tg-on': "ID"},hashContexts:{'class': depth0,'for': depth0,'data-tg-off': depth0,'data-tg-on': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(">\n</label>\n");
    stack1 = helpers['if'].call(depth0, "showLabels", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/headline', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

  function program1(depth0,data) {
    
    var buffer = '', helper, options;
    data.buffer.push("\n            <button class=\"btn-text\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "toggleDetail", "headline.detailId", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
    data.buffer.push(">Learn More ");
    data.buffer.push(escapeExpression((helper = helpers['fa-icon'] || (depth0 && depth0['fa-icon']),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "chevron-down", options) : helperMissing.call(depth0, "fa-icon", "chevron-down", options))));
    data.buffer.push("</i></button>\n          ");
    return buffer;
    }

  function program3(depth0,data) {
    
    
    data.buffer.push("\n          ");
    }

  function program5(depth0,data) {
    
    
    data.buffer.push("\n            ");
    }

  function program7(depth0,data) {
    
    var buffer = '';
    data.buffer.push("\n              <div class=\"svg-down-arrow\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "scrollToHeadline", "headline.detailId", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
    data.buffer.push(">&nbsp;</div>\n            ");
    return buffer;
    }

  function program9(depth0,data) {
    
    var buffer = '', stack1;
    data.buffer.push("\n      <div class=\"row\">\n        <p class=\"chart-click\">Click on a location below</p>\n        <div class=\"mtn-btn-container\">\n          <ul>\n            ");
    stack1 = helpers.each.call(depth0, "mountain", "in", "headline.mountains", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(10, program10, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n          </ul>\n        </div>\n        <div class=\"col-md-12\">\n          <img ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'id': ("headline.mountainContainer")
    },hashTypes:{'id': "ID"},hashContexts:{'id': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(" class=\"img-mtn\"></img>\n        </div>\n      </div>\n      ");
    return buffer;
    }
  function program10(depth0,data) {
    
    var buffer = '', stack1;
    data.buffer.push("\n              <li><button class=\"btn-chart\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "getMountain", "mountain", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
    data.buffer.push(" on=\"click\">");
    stack1 = helpers._triageMustache.call(depth0, "mountain.name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("</button></li>\n            ");
    return buffer;
    }

  function program12(depth0,data) {
    
    
    data.buffer.push("\n      ");
    }

  function program14(depth0,data) {
    
    var buffer = '', stack1;
    data.buffer.push("\n        <div class=\"row\">\n          <p class=\"chart-click\">Click on a tree species below</p>\n          <div class=\"chart-btn-container\">\n            <ul>\n              ");
    stack1 = helpers.each.call(depth0, "chart", "in", "headline.charts", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(15, program15, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n            </ul>\n          </div>\n          <div class=\"col-md-6 chartAlign\">\n           <img ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'id': ("headline.pictureContainer")
    },hashTypes:{'id': "ID"},hashContexts:{'id': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(" class=\"img-chart\"></img>\n          </div>\n          <div class=\"col-md-6\">\n            <img ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'id': ("headline.chartContainer")
    },hashTypes:{'id': "ID"},hashContexts:{'id': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(" class=\"img-fig\"></img>\n          </div>\n        </div>\n      ");
    return buffer;
    }
  function program15(depth0,data) {
    
    var buffer = '', stack1;
    data.buffer.push("\n                <li><button class=\"btn-chart\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "getChart", "chart", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
    data.buffer.push(" on=\"click\">");
    stack1 = helpers._triageMustache.call(depth0, "chart.plant.name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("</button></li><br>\n              ");
    return buffer;
    }

    data.buffer.push("<section class=\"full-height\" ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'id': ("headline.classId")
    },hashTypes:{'id': "STRING"},hashContexts:{'id': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(">\n  <div class=\"bcg\">\n    <div class=\"fill-lite\">\n      <div class=\"hsContainer\">\n        <div class=\"hsContent\">\n          <h1>");
    stack1 = helpers._triageMustache.call(depth0, "headline.title", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("</h1>\n          ");
    stack1 = helpers['if'].call(depth0, "headline.detail", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n          <div class=\"down-arrow\">\n            ");
    stack1 = helpers['if'].call(depth0, "headline.down", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</section>\n\n<div class=\"detail\" ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'id': ("headline.detailId")
    },hashTypes:{'id': "STRING"},hashContexts:{'id': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(">\n  <div class=\"hsContainer\">\n    <div id=\"headline-detail\" class=\"hsContent\">\n  <div class=\"row\">\n  <div class=\"row\">\n    <div class=\"col-md-12\">\n      <h2></h2>\n     </div>\n   </div>\n    <div id=\"detail-content\">\n   ");
    data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "headline.detail", {hash:{
      'unescaped': ("true")
    },hashTypes:{'unescaped': "STRING"},hashContexts:{'unescaped': depth0},contexts:[depth0],types:["ID"],data:data})));
    data.buffer.push("\n   </div>\n   \n   \n   ");
    stack1 = helpers['if'].call(depth0, "headline.mountains", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(12, program12, data),fn:self.program(9, program9, data),contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n\n      ");
    stack1 = helpers['if'].call(depth0, "headline.charts", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(12, program12, data),fn:self.program(14, program14, data),contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n      </div>\n\n\n    <button class=\"btn-text\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "toggleDetail", "headline.detailId", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
    data.buffer.push(">Close ");
    data.buffer.push(escapeExpression((helper = helpers['fa-icon'] || (depth0 && depth0['fa-icon']),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "chevron-up", options) : helperMissing.call(depth0, "fa-icon", "chevron-up", options))));
    data.buffer.push("</button>\n    </div>\n  </div>\n</div>\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/headlines', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, escapeExpression=this.escapeExpression, self=this;

  function program1(depth0,data) {
    
    var buffer = '';
    data.buffer.push("\n    <div ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'id': ("headline.scrollId")
    },hashTypes:{'id': "STRING"},hashContexts:{'id': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "scrollToHeadline", "headline.classId", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
    data.buffer.push(" class=\"right-nav-icon\"></div>\n  ");
    return buffer;
    }

  function program3(depth0,data) {
    
    var buffer = '';
    data.buffer.push("\n  ");
    data.buffer.push(escapeExpression(helpers.view.call(depth0, "headline", {hash:{
      'contentBinding': ("")
    },hashTypes:{'contentBinding': "ID"},hashContexts:{'contentBinding': depth0},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push("\n");
    return buffer;
    }

    data.buffer.push("<div id=\"rightNavContainer\">\n  ");
    stack1 = helpers.each.call(depth0, "headline", "in", "controller", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n</div>\n\n<div id=\"headlinesContainer\" >\n");
    stack1 = helpers.each.call(depth0, "headline", "in", "controller", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n</div>\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/instructions-cesium', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, helper, options, self=this, helperMissing=helpers.helperMissing;

  function program1(depth0,data) {
    
    
    data.buffer.push("\n  <div>\n    <p>\n      <h4>How to I use Cesium?</h4>\n      <ol>\n        <li>Select desired tree species</li>\n        <li>Select desired climate scenario</li>\n        <li>Select a year or click the Play button to animate through 2011-2081.</li>\n        <li>Click GET MAP to refresh Cesium with your final selections.</li>\n      </ol>\n    </p>\n  </div>\n");
    }

    stack1 = (helper = helpers['popup-modal'] || (depth0 && depth0['popup-modal']),options={hash:{
      'title': ("How to use Cesium"),
      'close': ("removeModal")
    },hashTypes:{'title': "STRING",'close': "STRING"},hashContexts:{'title': depth0,'close': depth0},inverse:self.noop,fn:self.program(1, program1, data),contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "popup-modal", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/maptip1-modal', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, helper, options, self=this, helperMissing=helpers.helperMissing;

  function program1(depth0,data) {
    
    
    data.buffer.push("\n  <div class=\"\">\n    <p>\n      <h4>Follow these steps to get a map.</h4>\n      <ol>\n        <li>Select desired tree species</li>\n        <li>Select desired climate scenario</li>\n        <li>Click LOAD IT! to refresh Cesium with your final selections.</li>\n        <li>Select a year or click the Play button to animate through 2011-2081. Be sure to LOAD IT! to refresh the maps.</li>\n      </ol>\n    </p>\n  </div>\n");
    }

    stack1 = (helper = helpers['popup-modal'] || (depth0 && depth0['popup-modal']),options={hash:{
      'title': ("Choose a species"),
      'close': ("removeModal")
    },hashTypes:{'title': "STRING",'close': "STRING"},hashContexts:{'title': depth0,'close': depth0},inverse:self.noop,fn:self.program(1, program1, data),contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "popup-modal", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/maptip2-modal', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, helper, options, self=this, helperMissing=helpers.helperMissing;

  function program1(depth0,data) {
    
    var buffer = '', stack1, helper, options;
    data.buffer.push("\n  <div>\n    <p>The best-case climate change scenario (rcp 2.6) is where CO)<sub>2</sub> emissions rise from current-day rates of ~9 billion tons per year, peak around mid-21<sup>st</sup> century, then decline to zero by the end of the 21<sup>st</sup> century. Under the worst-case scenario (rcp 8.5) - \"business as usual\" - emissions continue to rise at a relatively high rate throughout most of the 21<sup>st</sup> century, then stabilize at ~30 billion tons per year by the end of the century. See ");
    stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{
      'tagName': ("a")
    },hashTypes:{'tagName': "STRING"},hashContexts:{'tagName': depth0},inverse:self.noop,fn:self.program(2, program2, data),contexts:[depth0,depth0],types:["STRING","STRING"],data:data},helper ? helper.call(depth0, "headlines", "climate", options) : helperMissing.call(depth0, "link-to", "headlines", "climate", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push(" for more information.</p>\n  </div>\n");
    return buffer;
    }
  function program2(depth0,data) {
    
    
    data.buffer.push("Forest Change");
    }

    stack1 = (helper = helpers['popup-modal'] || (depth0 && depth0['popup-modal']),options={hash:{
      'title': ("Choosing a climate scenario"),
      'close': ("removeModal")
    },hashTypes:{'title': "STRING",'close': "STRING"},hashContexts:{'title': depth0,'close': depth0},inverse:self.noop,fn:self.program(1, program1, data),contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "popup-modal", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/maptip3-modal', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, helper, options, self=this, helperMissing=helpers.helperMissing;

  function program1(depth0,data) {
    
    
    data.buffer.push("\n  <div>\n    <p>Different shades of suitability measures how likely the local climate will match the temperature, precipitation, and seasonality requirements for the species of interest.</p>\n    <ul class=\"suitability\">\n      <li style=\"margin-bottom:10px;\" ><u><b>High</b></u>- High likelihood species will thrive and grow in most locations. Species likely to be most common here.</li>\n      <li style=\"margin-bottom:10px;\"><u><b>Medium</b></u>- Some likelihood that area will support growth of species but abundance will be more variable.</li>\n      <li class=\"suitability\"><u><b>Low</b></u>- Low likelihood that species will be present. Species will likely be quite rare and isolated to specific microevironments.</li>\n    </ul>\n  </div>\n");
    }

    stack1 = (helper = helpers['popup-modal'] || (depth0 && depth0['popup-modal']),options={hash:{
      'title': ("About the Legend"),
      'close': ("removeModal")
    },hashTypes:{'title': "STRING",'close': "STRING"},hashContexts:{'title': depth0,'close': depth0},inverse:self.noop,fn:self.program(1, program1, data),contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "popup-modal", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/plant', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1;


    data.buffer.push("<h1>This is a new plant!</h1>\n<h1>");
    stack1 = helpers._triageMustache.call(depth0, "plant.name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("</h1>\n<h2>");
    stack1 = helpers._triageMustache.call(depth0, "sci_name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("</h2>\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/plants', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, escapeExpression=this.escapeExpression, self=this;

  function program1(depth0,data) {
    
    var buffer = '';
    data.buffer.push("\n    ");
    data.buffer.push(escapeExpression(helpers.view.call(depth0, "plant", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push("\n    \n  ");
    return buffer;
    }

    data.buffer.push("<div id=\"plantContainer\">\n  ");
    stack1 = helpers.each.call(depth0, "plant", "in", "controller", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n</div>\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/video-modal', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, helper, options, self=this, helperMissing=helpers.helperMissing;

  function program1(depth0,data) {
    
    var buffer = '', stack1;
    data.buffer.push("\n  ");
    stack1 = helpers._triageMustache.call(depth0, "outerra.title", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n  ");
    stack1 = helpers._triageMustache.call(depth0, "outerra.url", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n");
    return buffer;
    }

    stack1 = (helper = helpers['popup-modal'] || (depth0 && depth0['popup-modal']),options={hash:{
      'title': ("Outerra View"),
      'close': ("removeModal")
    },hashTypes:{'title': "STRING",'close': "STRING"},hashContexts:{'title': depth0,'close': depth0},inverse:self.noop,fn:self.program(1, program1, data),contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "popup-modal", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n\n\n");
    return buffer;
    
  });

});
define('ffdm-frontend/templates/welcome', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1;


    data.buffer.push("\n\n \n\n\n\n");
    stack1 = helpers._triageMustache.call(depth0, "outlet", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n");
    return buffer;
    
  });

});
define('ffdm-frontend/tests/helpers/resolver', ['exports', 'ember/resolver', 'ffdm-frontend/config/environment'], function (exports, Resolver, config) {

  'use strict';

  var resolver = Resolver['default'].create();

  resolver.namespace = {
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix
  };

  exports['default'] = resolver;

});
define('ffdm-frontend/tests/helpers/start-app', ['exports', 'ember', 'ffdm-frontend/app', 'ffdm-frontend/router', 'ffdm-frontend/config/environment'], function (exports, Ember, Application, Router, config) {

  'use strict';

  function startApp(attrs) {
    var application;

    var attributes = Ember['default'].merge({}, config['default'].APP);
    attributes = Ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    Ember['default'].run(function () {
      application = Application['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }
  exports['default'] = startApp;

});
define('ffdm-frontend/tests/test-helper', ['ffdm-frontend/tests/helpers/resolver', 'ember-qunit'], function (resolver, ember_qunit) {

	'use strict';

	ember_qunit.setResolver(resolver['default']);

	document.write("<div id=\"ember-testing-container\"><div id=\"ember-testing\"></div></div>");

	QUnit.config.urlConfig.push({ id: "nocontainer", label: "Hide container" });
	var containerVisibility = QUnit.urlParams.nocontainer ? "hidden" : "visible";
	document.getElementById("ember-testing-container").style.visibility = containerVisibility;

});
define('ffdm-frontend/tests/unit/components/popup-modal-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent("popup-modal", "PopupModalComponent", {});

  ember_qunit.test("it renders", function () {
    expect(2);

    // creates the component instance
    var component = this.subject();
    equal(component._state, "preRender");

    // appends the component to the page
    this.append();
    equal(component._state, "inDOM");
  });
  // specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']

});
define('ffdm-frontend/tests/unit/controllers/carousel-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("controller:carousel", "CarouselController", {});

  // Replace this with your real tests.
  ember_qunit.test("it exists", function () {
    var controller = this.subject();
    ok(controller);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/controllers/cesium-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("controller:cesium", "CesiumController", {});

  // Replace this with your real tests.
  ember_qunit.test("it exists", function () {
    var controller = this.subject();
    ok(controller);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/controllers/charts-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("controller:charts", "ChartsController", {});

  // Replace this with your real tests.
  ember_qunit.test("it exists", function () {
    var controller = this.subject();
    ok(controller);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/controllers/headlines-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("controller:headlines", "HeadlinesController", {});

  // Replace this with your real tests.
  ember_qunit.test("it exists", function () {
    var controller = this.subject();
    ok(controller);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/controllers/maptip1-modal-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("controller:maptip1-modal", "Maptip1ModalController", {});

  // Replace this with your real tests.
  ember_qunit.test("it exists", function () {
    var controller = this.subject();
    ok(controller);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/controllers/mountain-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("controller:mountain", "MountainController", {});

  // Replace this with your real tests.
  ember_qunit.test("it exists", function () {
    var controller = this.subject();
    ok(controller);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/controllers/outerras-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("controller:outerras", "OuterrasController", {});

  // Replace this with your real tests.
  ember_qunit.test("it exists", function () {
    var controller = this.subject();
    ok(controller);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/controllers/plants-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("controller:plants", "PlantsController", {});

  // Replace this with your real tests.
  ember_qunit.test("it exists", function () {
    var controller = this.subject();
    ok(controller);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/models/chart-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel("chart", "Chart", {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test("it exists", function () {
    var model = this.subject();
    // var store = this.store();
    ok(!!model);
  });

});
define('ffdm-frontend/tests/unit/models/headline-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel("headline", "Headline", {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test("it exists", function () {
    var model = this.subject();
    // var store = this.store();
    ok(!!model);
  });

});
define('ffdm-frontend/tests/unit/models/mountain-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel("mountain", "Mountain", {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test("it exists", function () {
    var model = this.subject();
    // var store = this.store();
    ok(!!model);
  });

});
define('ffdm-frontend/tests/unit/models/outerra-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel("outerra", "Outerra", {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test("it exists", function () {
    var model = this.subject();
    // var store = this.store();
    ok(!!model);
  });

});
define('ffdm-frontend/tests/unit/models/plant-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel("plant", "Plant", {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test("it exists", function () {
    var model = this.subject();
    // var store = this.store();
    ok(!!model);
  });

});
define('ffdm-frontend/tests/unit/routes/application-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("route:application", "ApplicationRoute", {});

  ember_qunit.test("it exists", function () {
    var route = this.subject();
    ok(route);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/routes/carousel-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("route:carousel", "CarouselRoute", {});

  ember_qunit.test("it exists", function () {
    var route = this.subject();
    ok(route);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/routes/cesium-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("route:cesium", "CesiumRoute", {});

  ember_qunit.test("it exists", function () {
    var route = this.subject();
    ok(route);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/routes/headlines-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("route:headlines", "HeadlinesRoute", {});

  ember_qunit.test("it exists", function () {
    var route = this.subject();
    ok(route);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/routes/plants-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("route:plants", "PlantsRoute", {});

  ember_qunit.test("it exists", function () {
    var route = this.subject();
    ok(route);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/routes/welcome-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("route:welcome", "WelcomeRoute", {});

  ember_qunit.test("it exists", function () {
    var route = this.subject();
    ok(route);
  });
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('ffdm-frontend/tests/unit/views/cesium-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("view:cesium", "CesiumView");

  // Replace this with your real tests.
  ember_qunit.test("it exists", function () {
    var view = this.subject();
    ok(view);
  });

});
define('ffdm-frontend/tests/unit/views/headline-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("view:headline", "HeadlineView");

  // Replace this with your real tests.
  ember_qunit.test("it exists", function () {
    var view = this.subject();
    ok(view);
  });

});
define('ffdm-frontend/tests/unit/views/plant-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("view:plant", "PlantView");

  // Replace this with your real tests.
  ember_qunit.test("it exists", function () {
    var view = this.subject();
    ok(view);
  });

});
define('ffdm-frontend/views/cesium-holding', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].View.extend({

    didInsertElement: function () {
      var CESIUM_BASE_URL = ".";
      var cesiumController = this.get("controller");
      var proxy = cesiumController.get("proxy");
      var rcp = cesiumController.get("rcp");
      var species = cesiumController.get("species");

      var imageryLayers = cesiumController.get("imageryLayers");
      var imageryViewModels = cesiumController.get("imageryViewModels");

      Cesium.BingMapsApi.defaultKey = "AslSxct_WT1tBMfBnXE7Haqq3rosfoymosE84z64f5FO7RMjEez3fFWw5HU0WLJ-";
      terrainViewModels = [];


      var viewer = new Cesium.Viewer("cesiumContainer", {


        animation: false,

        imageryProviderViewModels: imageryViewModels,
        timeline: false,
        sceneModePicker: false });
      viewer.clock.onTick.addEventListener(function (clock) {
        var camera = viewer.camera;
      });
      var scene = viewer.scene;
      var globe = scene.globe;
      cesiumController.set("viewer", viewer);
      //set the imagery layers for controller
      imageryLayers = globe.imageryLayers;
      cesiumController.set("imageryLayers", imageryLayers);
      console.log(cesiumController.get("viewer"));

      /*
          Create an event handler for onclick events
          var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
          handler.setInputAction(function(cursor) {
            console.log(cursor.position);
            var pickedObject = scene.pick(cursor.position);
            console.log(pickedObject);
            if (Cesium.defined(pickedObject)) {
              var id = Cesium.defaultValue(pickedObject.id, pickedObject.primitive.id);
              if (id instanceof Cesium.Entity) {
                console.log(id.name);
              }
            } else {
              console.log("No entity here");
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
       */


      this.initCB();
    },

    initCB: function () {
      console.log("initCB has been called by CesiumView");
      var cesiumController = this.get("controller");
      cesiumController.setupLayers();
      var viewer = cesiumController.get("viewer");
      var camera = viewer.camera;

      //cesiumController.loadPoints();
      camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-111.1, 36.998, 5000000)
      });
      console.log(camera.positionCartographic);
    }

  });

});
define('ffdm-frontend/views/cesium', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].View.extend({

    didInsertElement: function () {
      /* modal on page load
      $(function() {
        $("#instructions").modal();
      });*/

      var webgl = this.webglDetect();
      if (webgl) {
        console.log("WebGL supported");
      } else {
        console.log("WebGL disabled or not supported");
        $("#instructions").modal();
      }


      var CESIUM_BASE_URL = ".";
      var cesiumController = this.get("controller");
      var proxy = cesiumController.get("proxy");
      var rcp = cesiumController.get("rcp");
      var species = cesiumController.get("species");

      var imageryLayers = cesiumController.get("imageryLayers");
      //var imageryViewModels = cesiumController.get('imageryViewModels');
      Cesium.BingMapsApi.defaultKey = "AslSxct_WT1tBMfBnXE7Haqq3rosfoymosE84z64f5FO7RMjEez3fFWw5HU0WLJ-";

      //Define the default imagery and terrain models
      var imageryViewModels = cesiumController.createDefaultImageryViewModels();
      var terrainViewModels = cesiumController.createDefaultTerrainViewModels();


      var extent = new Cesium.Rectangle.fromDegrees(-125, 20, -80, 55);
      Cesium.Camera.DEFAULT_VIEW_RECTANGLE = extent;
      Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

      var viewer = new Cesium.Viewer("cesiumContainer", {


        animation: false,
        baseLayerPicker: true,
        imageryProviderViewModels: imageryViewModels,
        terrainProviderViewModels: terrainViewModels,
        navigationInstructionsInitiallyVisible: true,
        timeline: false
      });
      viewer.clock.onTick.addEventListener(function (clock) {
        var camera = viewer.camera;
      });
      var scene = viewer.scene;
      var globe = scene.globe;
      cesiumController.set("viewer", viewer);

      viewer.homeButton.viewModel.tooltip = "Reset zoom";
      console.log(viewer.homeButton.viewModel.command);
      //set the imagery layers for controller
      imageryLayers = globe.imageryLayers;
      cesiumController.set("imageryLayers", imageryLayers);

      /*
          Create an event handler for onclick events
          var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
          handler.setInputAction(function(cursor) {
            console.log(cursor.position);
            var pickedObject = scene.pick(cursor.position);
            console.log(pickedObject);
            if (Cesium.defined(pickedObject)) {
              var id = Cesium.defaultValue(pickedObject.id, pickedObject.primitive.id);
              if (id instanceof Cesium.Entity) {
                console.log(id.name);
              }
            } else {
              console.log("No entity here");
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
       */


      this.initCB();
    },

    initCB: function () {
      console.log("initCB has been called by CesiumView");
      var cesiumController = this.get("controller");
      cesiumController.setupLayers();
      var viewer = cesiumController.get("viewer");
      var camera = viewer.camera;
      //cesiumController.loadPoints();
      /*camera.flyTo({ 
          destination: Cesium.Cartesian3.fromDegrees(-111.100, 36.998, 5000000.0)
      });*/
      console.log(camera.positionCartographic);
    },

    webglDetect: function (return_context) {
      if (!!window.WebGLRenderingContext) {
        var canvas = document.createElement("canvas"),
            names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
            context = false;

        for (var i = 0; i < 4; i++) {
          try {
            context = canvas.getContext(names[i]);
            if (context && typeof context.getParameter == "function") {
              // WebGL is enabled
              if (return_context) {
                // return WebGL object if the the function's argument is present
                return { name: names[i], gl: context };
              }
              // else return just true
              return true;
            }
          } catch (e) {}
        }

        // WebGL is supported, but disabled
        return false;
      }

      return false;
    }

  });

});
define('ffdm-frontend/views/headline', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].View.extend({
    tagName: "wrapper",
    templateName: "headline",
    didInsertElement: function () {
      var controller = this.get("controller");
      controller.set("classCounter", controller.get("classCounter") + 1);
      if (controller.get("classCounter") === controller.get("classArray").length) {
        controller.bindScrolling();
      }
    }
  });

});
define('ffdm-frontend/views/plant', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].View.extend({
    wrapper: "div",
    templateName: "plant"
  });

});
/* jshint ignore:start */

/* jshint ignore:end */

/* jshint ignore:start */

define('ffdm-frontend/config/environment', ['ember'], function(Ember) {
  var prefix = 'ffdm-frontend';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("ffdm-frontend/tests/test-helper");
} else {
  require("ffdm-frontend/app")["default"].create({"API_HOST":"http://192.81.135.213:1337"});
}

/* jshint ignore:end */
//# sourceMappingURL=ffdm-frontend-1c3c50e86ec589186466e2416797e516.map