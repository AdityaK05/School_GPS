# Operations & Incident Runbook

## 1. Daily Transport Routine

1. **Trip Initialization (06:30 AM):**
   - Transport manager or automated scheduler schedules daily route trips.
   - Drivers and attendants assigned to fleet buses.
2. **Attendant Departure Check (07:00 AM):**
   - Attendant logs into mobile application.
   - Syncs route passenger manifest.
   - Confirms offline queue is empty (`SYNCED`).
   - Taps "Start Trip".
3. **Passenger Boarding & Verification:**
   - Student taps 13.56 MHz RFID card on attendant terminal / vehicle gate.
   - Valid tap registers `BOARDED` state.
   - Discrepancies generate real-time alerts (`WRONG_BUS`).
4. **Transit & Disembarkation:**
   - Vehicle location updates every 5–15 seconds via GPS telematics.
   - At destination stop, student taps card to record `EXIT_RECORDED`.
   - 5-minute timer monitors for unrecorded exits (`EXIT_MISSING`).
5. **Trip Completion:**
   - Attendant completes cabin sweep and taps "Complete Trip".

---

## 2. Safety Exception Resolution

- **WRONG_BUS:**
  - Critical Exception: Student is on incorrect bus.
  - Action: Attendant contacts school transport dispatch immediately; school admin logs verified handover in Admin Exception Center.
- **EXIT_MISSING:**
  - Critical Exception: Student did not scan card at designated drop-off stop within 5 minutes.
  - Action: Driver halts vehicle, attendant performs physical seat check; exception is manually resolved with reason text once student is accounted for.
- **MANUAL_ATTENDANCE_OVERRIDE:**
  - Used when student forgot physical card.
  - Requires attendant/admin to document reason; logged to immutable `audit_logs` ledger.

---

## 3. Disaster Recovery & Backups

- **Database:** Supabase automated daily WAL backups with Point-in-Time Recovery (PITR).
- **Network Outage:** Mobile terminals buffer all tap and override events locally in persistent storage. Upon connection recovery, events automatically flush with original UUID v7 timestamps.
