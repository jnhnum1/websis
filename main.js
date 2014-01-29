/**
 * Directions:
 *  1. Go to your websis class schedule
 *  2. Go to the javascript console in Chrome (right-click, inspect element, click
 *  console)
 *  3. Paste this code and press enter.  If you see an error about gapi typeerror, try again.
 *  4. Grant access.
 *  5. See your classes appear in your Google Calendar!
 *  (6.) Report an issue at (https://github.com/jnhnum1/websis/issues) if there
 *  are any problems.  Also, if the times of your classes seem to be offset,
 *  check that your calendar has its timezone set to eastern time (GMT -5:00).
 * 
 */

(function() {
  var clientId = '1032807918132.apps.googleusercontent.com';
  var scope = 'https://www.googleapis.com/auth/calendar';
  var apiKey = 'AIzaSyA3E0X5W_Q2spjPrehYTQI49w-xYGLjzDY';

  var dates = {
    MO: "2014-02-10T",
    TU: "2014-02-04T",
    WE: "2014-02-05T",
    TH: "2014-02-06T",
    FR: "2014-02-07T",
    SA: "2014-02-08T",
    SU: "2014-02-09T",
    LASTDAY: "20140515",
  };

  var withGApi = function(data, textStatus, jqxhr) {
      console.log("gapi loaded");
      setTimeout(function() {
          gapi.client.setApiKey(apiKey);
          gapi.auth.init(checkAuth);
      }, 100);
  }

  var checkAuth = function() {
      console.log("checking authentication ... make sure the pop-up doesn't get blocked.");
      setTimeout(function() {
          gapi.auth.authorize({client_id: clientId, scope: scope, immediate: false}, handleAuthResult);
      }, 1);
  }

  var handleAuthResult = function(authResult) {
      if(authResult) {
          console.log("authentication successful");
          gapi.client.load("calendar", "v3", function() {
              var $ = jQuery;
              var tableSize = $("tr", $("table").get(1)).size();
              var subject;
              $("tr", $("table").get(1)).each(function(i, elem) {
              if (i >= 2 && i !== tableSize - 1) {
                  subject = $($("td:first input", this)).val() || subject;
                  var typeText = $($("td", this).get(2)).text().trim();
                  var timeText = $($("td", this).get(3)).text().trim();
                  var roomText = $($("td", this).get(4)).text().trim();
                  var type = null;
                  if (typeText) {
                      if (typeText.substring(0,3) == "Lab") {
                          type = " Lab";
                      } else if (typeText.substring(0,3) == "Lec") {
                          type = " Lecture";
                      } else if (typeText[0] == "R") {
                          type = " Recitation";
                      } else {
                          type = "";
                      }
                  }
                  if (type !== null){
                      var times = parseTimeString(timeText);
                      if (times) {
                          var recurList = [];
                          for(var i = 0; i < times.length; i++) {
                              recurList.push("RRULE:FREQ=WEEKLY;UNTIL="+dates.LASTDAY+";BYHOUR=" + times[i].startHour + ";BYMINUTE=" + times[i].startMinute+";BYDAY=" + times[i].days2String);
                          }
                          var firstEvent = findFirstEvent(times);
                          var startDateTime = firstEvent.startHour + ":" + firstEvent.startMinute + ":00";
                          var endDateTime = firstEvent.endHour + ":" + firstEvent.endMinute + ":00";
                          var firstDay = firstEvent.day;
                          var firstDate = dates[firstDay];
                          var request = gapi.client.calendar.events.insert(
                              {"calendarId": "primary",
                                  resource: {
                                       "summary": (subject + type),
                                       "location": roomText,
                                       "start": {
                                          "dateTime": firstDate + startDateTime,
                                          "timeZone": "America/New_York"
                                       },
                                       "end": {
                                          "dateTime": firstDate + endDateTime,
                                          "timeZone": "America/New_York"
                                      },
                                      "recurrence": recurList
                                  }});
                          (function(x) {
                              request.execute(function(resp) {
                                  if (resp) {
                                      console.log("Added " + x);
                                  }
                             });
                          })(subject + type);
                      }
                  }
              }
          });
          });
      } else {
          console.log("authentication failed");
      }
  }

  var min = function(list) {
      if (list.length == 0) {
          return null;
      }
      var curMin = list[0];
      list.forEach(function(x) {
          if (x < curMin) {
              curMin = x;
          }
      });
      return curMin;
  }

  var day2ToInt = function(day2) {
      return {'WE' : 0, 'TH' : 1, 'FR' : 2, 'SA' : 3, 'SU' : 4, 'MO' : 5, 'TU' : 6}[day2]
  }

  var intToDay2 = function(dayint) {
      return ['WE', 'TH', 'FR', 'SA', 'SU', 'MO', 'TU'][dayint];
  }

  var findFirstEvent = function(times) {
      var minDay = Math.min.apply(this, times[0].dayList);
      var minStartHour = times[0].startHour;
      var minStartMinute = times[0].startMinute;
      var minEndHour = times[0].endHour;
      var minEndMinute = times[0].endMinute;

      times.forEach(function(time) {
          var thisMinDay = Math.min.apply(this, time.dayList);
          if (thisMinDay < minDay) {
              minDay = thisMinDay;
              minStartHour = time.startHour;
              minStartMinute = time.startMinute;
              minEndHour = time.endHour;
              minEndMinute = time.endMinute;
          }
      });
      return {startHour: minStartHour, startMinute: minStartMinute, endHour: minEndHour, endMinute: minEndMinute, day: intToDay2(minDay)};
  }


  var day_1_to_2 = function(x) {
      return ({'M': 'MO', 'T': 'TU', 'W': 'WE', 'R': 'TH', 'F': 'FR', 'S': 'SA', 'U': 'SU'})[x]
  }
  // returns a list of objects with startHour, startMinute, endHour, endMinute, and days2String properties, all ready to be directly included in the rrule string.
  // test cases: M2:30-4 TR5 W3-3:30 R5:40
  var parseTimeString = function(timeString) {
      var timeChunks = timeString.match(/([MTWRFSU]+(\s\w+\s)?)\(?([\d-\.]+(\s\w+)?\)?)/g);
      var retObj = [];
      if (!timeChunks) {
          return null;
      }
      timeChunks.forEach(function(x) {
              
              var days = x.match(/[MTWRFSU]+/)[0];
              var dayList = days.split("").map(day_1_to_2);
              var days2String = dayList.join(",");

              var times = x.match(/(\d+)(\.(\d+))?(-(\d+)(\.(\d+))?)?/);
              var patt = /PM/;
              var startHour = times[1];
              var endHour = times[5] || ("" + (parseInt(startHour) + 1));
              
              if(patt.test(x) || parseInt(startHour) < 9){
                  startHour = "" + (parseInt(startHour)+12);
              }
              if(patt.test(x) || parseInt(endHour) < 9){
                  endHour = "" + (parseInt(endHour) + 12);

              }         
              var startMinute = times[3] || "00";
              var endMinute = times[7];
              if (!endMinute) {
                  if (times[5]) {
                      endMinute = "00";
                  } else {
                      endMinute = startMinute;
                  }
              }
              retObj.push({startHour: startHour, startMinute: startMinute, endHour: endHour, endMinute: endMinute, days2String: days2String, dayList: dayList.map(day2ToInt)});
          
          }
      );
      return retObj;
  }

  var withJquery = function() {
      var $ = jQuery;
      $.getScript("https://apis.google.com/js/client.js", withGApi);
  }

  var jqScript = document.createElement('script');
  var head= document.getElementsByTagName('head')[0];

  jqScript.type='text/javascript';
  jqScript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js';

  jqScript.onload = withJquery;

  head.appendChild(jqScript);
})();
