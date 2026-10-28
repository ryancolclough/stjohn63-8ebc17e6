var fs = require("fs");
var path = require("path");
var meetings = require("./meetings.js");

function atToronto(year, month, day, hour, minute) {
  var wanted = Date.UTC(year, month - 1, day, hour, minute);
  var utc = wanted;
  var fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  for (var i = 0; i < 4; i += 1) {
    var parts = {};
    fmt.formatToParts(new Date(utc)).forEach(function (part) {
      parts[part.type] = part.value;
    });
    var hourValue = Number(parts.hour);
    if (hourValue === 24) hourValue = 0;
    var seen = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), hourValue, Number(parts.minute));
    if (seen === wanted) return new Date(utc);
    utc += wanted - seen;
  }
  return new Date(utc);
}

var schedule = JSON.parse(fs.readFileSync(path.join(__dirname, "../assets/meetings.json"), "utf8"));
var list = schedule.meetings;
var failed = 0;

function check(name, ok) {
  if (ok) {
    console.log("ok  " + name);
    return;
  }
  failed += 1;
  console.error("FAIL " + name);
}

function lineOn(year, month, day, hour, minute) {
  return meetings.meetingLine(meetings.selectNext(list, atToronto(year, month, day, hour, minute)), schedule.location);
}

check(
  "Oct 17 2026 gives November 11",
  lineOn(2026, 10, 17, 12, 0) === "Wednesday, November 11, 2026\n7:30\u00A0PM\n55 Bridge Street, Carleton Place"
);
check("May 14 2026 gives September 9", lineOn(2026, 5, 14, 12, 0).indexOf("Wednesday, September 9, 2026\n7:30\u00A0PM\n") === 0);
check("June 1 2026 skips summer", lineOn(2026, 6, 1, 9, 0).indexOf("Wednesday, September 9, 2026") === 0);
check("May 13 2026 at 9:30 PM stays on that date", lineOn(2026, 5, 13, 21, 30).indexOf("Wednesday, May 13, 2026") === 0);
check("Nov 11 2026 at 6 PM stays on that date", lineOn(2026, 11, 11, 18, 0).indexOf("Wednesday, November 11, 2026") === 0);
check("Nov 11 2026 at 11:30 PM stays on that date", lineOn(2026, 11, 11, 23, 30).indexOf("Wednesday, November 11, 2026") === 0);
check("Nov 12 2026 rolls to December 9", lineOn(2026, 11, 12, 0, 1).indexOf("Wednesday, December 9, 2026") === 0);

var lateUtc = meetings.selectNext(list, new Date("2026-11-12T04:30:00Z"));
var rolledUtc = meetings.selectNext(list, new Date("2026-11-12T05:00:00Z"));
check("04:30 UTC on Nov 12 is still Nov 11 in Toronto", lateUtc && lateUtc.date === "2026-11-11");
check("05:00 UTC on Nov 12 is Dec 9 in Toronto", rolledUtc && rolledUtc.date === "2026-12-09");

var withSpecial = list.concat([
  { date: "2026-11-04", time: "19:00", special: true, label: "Emergent Meeting", location: "55 Bridge Street, Carleton Place" }
]);
var special = meetings.selectNext(withSpecial, atToronto(2026, 10, 17, 12, 0));
check("sooner special takes precedence", special && special.special && special.date === "2026-11-04");
check("special heading uses its label", meetings.headingFor(special) === "Emergent Meeting");
check(
  "special line uses its own time",
  meetings.meetingLine(special, schedule.location) === "Wednesday, November 4, 2026\n7:00\u00A0PM\n55 Bridge Street, Carleton Place"
);

var sameDay = [
  { date: "2026-11-11", time: "19:30" },
  { date: "2026-11-11", time: "18:00", special: true, label: "Emergent Meeting" }
];
var same = meetings.selectNext(sameDay, atToronto(2026, 11, 11, 12, 0));
check("same-day special wins", same && same.special === true && same.time === "18:00");

var laterSpecial = list.concat([{ date: "2026-12-20", time: "19:30", special: true }]);
var regularFirst = meetings.selectNext(laterSpecial, atToronto(2026, 10, 17, 12, 0));
check("later special does not jump the queue", regularFirst && regularFirst.date === "2026-11-11" && !regularFirst.special);

var lastDay = meetings.selectNext(list, atToronto(2028, 5, 10, 23, 0));
var afterLast = meetings.selectNext(list, atToronto(2028, 5, 11, 0, 1));
check("last listed day is still shown", lastDay && lastDay.date === "2028-05-10");
check("day after the list falls back", meetings.meetingLine(afterLast) === meetings.FALLBACK);
check("empty list falls back", meetings.meetingLine(meetings.selectNext([], new Date())) === "Next meeting date to be announced");

list.forEach(function (entry) {
  var parts = entry.date.split("-");
  var seen = meetings.partsOf(new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 17, 0, 0)));
  var month = Number(parts[1]);
  check(entry.date + " is a Wednesday", seen.weekday === "Wed");
  check(entry.date + " is outside June, July and August", month !== 6 && month !== 7 && month !== 8);
  check(entry.date + " is 7:30 PM and not a special", entry.time === "19:30" && entry.special !== true);
});
check("published list has the September 2025 through May 2028 regular meetings", list.length === 27);
check("first published date is Sep 10 2025", list[0].date === "2025-09-10");
check("last published date is May 10 2028", list[list.length - 1].date === "2028-05-10");

var passedToday = meetings.eventHasPassed("2026-10-16", atToronto(2026, 10, 17, 16, 0));
var stillToday = meetings.eventHasPassed("2026-10-17", atToronto(2026, 10, 17, 16, 0));
check("Oct 16 has passed on Oct 17", passedToday === true);
check("Oct 17 has not passed on Oct 17", stillToday === false);

if (failed) {
  console.error(failed + " check(s) failed");
  process.exit(1);
}
console.log("all meeting checks passed");
