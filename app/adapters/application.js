import Ember from 'ember';
import DS from 'ember-data';

export default DS.RESTAdapter.extend({
  coalesceFindResults: true, // these blueprints support coalescing (reduces the amount of calls)
  namespace: '',             // same as API prefix in Sails config
  host: 'http://localhost:1337' //Sails Server
});

