// Hourly slots 6:00 AM through 11:00 PM (last slot 11:00 PM – 12:00 AM).
const FULL_DAY = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'];

function nextHour(t) {
  const m = (t || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return t;
  let h = (+m[1]) % 12; if (/pm/i.test(m[3])) h += 12;
  let total = h * 60 + (+m[2]) + 60;
  let nh = Math.floor(total / 60) % 24, nm = total % 60;
  const ap = nh >= 12 ? 'PM' : 'AM'; let hh = nh % 12; if (hh === 0) hh = 12;
  return `${hh}:${String(nm).padStart(2, '0')} ${ap}`;
}
const slotLabel = (t) => `${t} - ${nextHour(t)}`;
function timeToMin(t) { const m = (t || '').match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = (+m[1]) % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + (+m[2]); }
function venueHours(v) { const parts = (v.hours || '6:00 AM – 12:00 AM').split(/–|-/); let open = timeToMin(parts[0].trim()); let close = timeToMin((parts[1] || '').trim()); if (close === 0) close = 24 * 60; return { open, close }; }

// Compute slot list for a venue/date overlaying DB slot rows (real bookings/maintenance).
function computeSlots(venue, date, dbSlots) {
  const { open, close } = venueHours(venue);
  const byStart = {}; (dbSlots || []).forEach((s) => { byStart[s.startTime] = s; });
  return FULL_DAY.map((t) => {
    const row = byStart[t];
    let status = 'Available';
    if (row && ['Booked', 'Pending', 'Closed', 'Maintenance', 'Almost Full', 'Cancelled'].includes(row.status)) {
      status = row.status === 'Cancelled' ? 'Available' : row.status;
    }
    const m = timeToMin(t);
    if (status === 'Available' && (m < open || m >= close)) status = 'Closed';
    return { startTime: t, endTime: nextHour(t), label: slotLabel(t), status, bookingId: row ? row.bookingId : null };
  });
}

module.exports = { FULL_DAY, nextHour, slotLabel, timeToMin, venueHours, computeSlots };
