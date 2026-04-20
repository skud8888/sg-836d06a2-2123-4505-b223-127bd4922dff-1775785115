/**
 * Artillery.io Load Test Processor
 * Custom functions for load testing scenarios
 */

module.exports = {
  // Generate random student data for testing
  generateStudentData: function(requestParams, context, ee, next) {
    const names = ['John', 'Jane', 'Mike', 'Sarah', 'Tom', 'Emma'];
    const surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis'];
    
    context.vars.firstName = names[Math.floor(Math.random() * names.length)];
    context.vars.lastName = surnames[Math.floor(Math.random() * surnames.length)];
    context.vars.email = `${context.vars.firstName.toLowerCase()}.${context.vars.lastName.toLowerCase()}${Date.now()}@test.com`;
    context.vars.phone = `+44${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    return next();
  },

  // Generate random course selection
  selectRandomCourse: function(requestParams, context, ee, next) {
    const courseIds = [
      'course-1',
      'course-2',
      'course-3',
      'course-4',
      'course-5'
    ];
    
    context.vars.courseId = courseIds[Math.floor(Math.random() * courseIds.length)];
    return next();
  },

  // Log response times
  logResponseTime: function(requestParams, response, context, ee, next) {
    if (response.timings && response.timings.phases) {
      console.log(`Response time: ${response.timings.phases.firstByte}ms`);
    }
    return next();
  },

  // Check for performance issues
  checkPerformance: function(requestParams, response, context, ee, next) {
    const threshold = 3000; // 3 seconds
    
    if (response.timings && response.timings.phases.firstByte > threshold) {
      console.warn(`⚠️ Slow response detected: ${response.timings.phases.firstByte}ms`);
      ee.emit('counter', 'slow_responses', 1);
    }
    
    return next();
  }
};