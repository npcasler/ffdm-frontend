import DS from 'ember-data';

export default DS.Model.extend({
  name      : DS.attr('string'),
  sci_name  : DS.attr('string'),
  createdAt : DS.attr(),  
  updatedAt : DS.attr()
  
});