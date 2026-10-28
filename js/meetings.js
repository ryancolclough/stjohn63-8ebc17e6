(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SJ63Meetings = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var TIME_ZONE = "America/Toronto";
  var PLACE = "55 Bridge Street, Carleton Place";
  var FALLBACK = "Next meeting date to be announced";
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function partsOf(date) {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23"
    });
    var parts = {};
    fmt.formatToParts(date).forEach(function (part) {
      parts[part.type] = part.value;
    });
    var hour = Number(parts.hour);
    if (hour === 24) hour = 0;
    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hour: hour,
      minute: Number(parts.minute),
      weekday: parts.weekday
    };
  }

  function civilInstant(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day, 17, 0, 0));
  }

  function dateKey(year, month, day) {
    return year * 10000 + month * 100 + day;
  }

  function parseISODate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    var seen = partsOf(civilInstant(year, month, day));
    if (seen.year !== year || seen.month !== month || seen.day !== day) return null;
    return { year: year, month: month, day: day };
  }

  function formatDate(meeting) {
    var parts = meeting.year ? meeting : parseISODate(meeting.date);
    if (!parts) return "";
    return new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(civilInstant(parts.year, parts.month, parts.day));
  }

  function formatTime(value) {
    var match = /^(\d{2}):(\d{2})$/.exec(value || "");
    if (!match) return "";
    var hour = Number(match[1]);
    var minute = match[2];
    if (hour > 23 || Number(minute) > 59) return "";
    var suffix = hour >= 12 ? "PM" : "AM";
    var hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    return hour12 + ":" + minute + "\u00A0" + suffix;
  }

  function selectNext(list, now) {
    var when = now instanceof Date ? now : new Date(now);
    var today = partsOf(when);
    var todayKey = dateKey(today.year, today.month, today.day);
    var upcoming = [];
    (list || []).forEach(function (entry) {
      if (!entry) return;
      var parts = parseISODate(entry.date);
      if (!parts) return;
      var key = dateKey(parts.year, parts.month, parts.day);
      if (key < todayKey) return;
      upcoming.push(entry);
    });
    upcoming.sort(function (a, b) {
      var aKey = dateKeyFrom(a.date);
      var bKey = dateKeyFrom(b.date);
      if (aKey !== bKey) return aKey - bKey;
      return (b.special === true ? 1 : 0) - (a.special === true ? 1 : 0);
    });
    return upcoming.length ? upcoming[0] : null;
  }

  function dateKeyFrom(value) {
    var parts = parseISODate(value);
    return parts ? dateKey(parts.year, parts.month, parts.day) : 0;
  }

  function meetingLine(meeting, location) {
    if (!meeting) return FALLBACK;
    var pieces = [formatDate(meeting)];
    var time = formatTime(meeting.time);
    if (time) pieces.push(time);
    pieces.push(meeting.location || location || PLACE);
    return pieces.filter(Boolean).join("\n");
  }

  function headingFor(meeting) {
    if (meeting && meeting.special) return meeting.label || "Emergent Meeting";
    return "Next Regular Meeting";
  }

  function applyMeeting(targets, data, now) {
    if (!targets || !targets.line) return null;
    var list = data && data.meetings ? data.meetings : [];
    var location = data && data.location;
    var meeting = selectNext(list, now || new Date());
    targets.line.textContent = meetingLine(meeting, location);
    if (targets.title) targets.title.textContent = headingFor(meeting);
    return meeting;
  }

  function loadNextMeeting(targets, now) {
    if (!targets || !targets.line || typeof fetch !== "function") return;
    fetch("assets/meetings.json", { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("meetings");
        return response.json();
      })
      .then(function (data) {
        applyMeeting(targets, data, now || new Date());
      })
      .catch(function () {
        /* Keep the lodge rule already written in the page. */
      });
  }

  function eventHasPassed(dateStr, now) {
    var parts = parseISODate(dateStr);
    if (!parts) return false;
    var today = partsOf(now instanceof Date ? now : new Date(now));
    return dateKey(parts.year, parts.month, parts.day) < dateKey(today.year, today.month, today.day);
  }

  function hidePastEvents(root, now) {
    if (!root || !root.querySelectorAll) return;
    var when = now instanceof Date ? now : new Date(now);
    root.querySelectorAll("[data-date]").forEach(function (card) {
      if (eventHasPassed(card.getAttribute("data-date"), when)) card.hidden = true;
    });
  }

  return {
    TIME_ZONE: TIME_ZONE,
    FALLBACK: FALLBACK,
    partsOf: partsOf,
    selectNext: selectNext,
    meetingLine: meetingLine,
    headingFor: headingFor,
    applyMeeting: applyMeeting,
    loadNextMeeting: loadNextMeeting,
    formatDate: formatDate,
    formatTime: formatTime,
    eventHasPassed: eventHasPassed,
    hidePastEvents: hidePastEvents,
    WEEKDAYS: WEEKDAYS
  };
});
