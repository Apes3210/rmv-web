
const PH_TIMEZONE_OFFSET = '+08:00';
const StaffAvailabilityStatus = { AVAILABLE: 'available' };

function getSlotDateTime(dateStr, slotCode) {
  return new Date(`${dateStr}T${slotCode}:00${PH_TIMEZONE_OFFSET}`);
}

function doesShiftCoverDateTime(session, targetDateTime) {
  return Boolean(
    session
      && !session.closedAt
      && session.availabilityStatus === StaffAvailabilityStatus.AVAILABLE
      && session.shiftStartAt
      && session.shiftEndAt
      && session.shiftStartAt.getTime() <= targetDateTime.getTime()
      && session.shiftEndAt.getTime() >= targetDateTime.getTime(),
  );
}

// Test case from user screenshot
const dateStr = '2026-04-24';
const slotCode = '09:00';
const targetDateTime = getSlotDateTime(dateStr, slotCode);

const session = {
  availabilityStatus: 'available',
  shiftStartAt: new Date('2026-04-24T00:00:00.000Z'), // 8:00 AM PH
  shiftEndAt: new Date('2026-04-27T09:00:00.000Z'),   // 5:00 PM PH on 27th
  closedAt: null
};

console.log('Target Date Time (UTC):', targetDateTime.toISOString());
console.log('Shift Start (UTC):', session.shiftStartAt.toISOString());
console.log('Shift End (UTC):', session.shiftEndAt.toISOString());
console.log('Is covered:', doesShiftCoverDateTime(session, targetDateTime));
