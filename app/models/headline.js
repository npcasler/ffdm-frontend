import DS from 'ember-data';

export default DS.Model.extend({
  title: DS.attr('string'),
  classId: DS.attr('string'),
  orderId: DS.attr('string'),
  pageId: DS.attr('string'),
  detail: DS.attr('string'),
  chart: DS.attr('string'),
  down: DS.attr('boolean'),
  createdAt: DS.attr(),
  updatedAt: DS.attr()
  
});
