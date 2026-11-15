# Operational Runbook & System Administration Guide
**School Transport Safety & Accountability Platform**

This guide documents standard operating procedures, exception handling, daily trip operations, device maintenance, and incident management for School Administrators and Transport Operations Managers.

---

## 1. Daily Transportation Lifecycle

### A. Morning Shift Preparation
1. **Trip Manifest Verification**: Transport managers verify the morning schedule via the Admin Dashboard.
2. **Device Readiness Check**:
   - Verify all active fleet buses display `LIVE` GPS freshness ($<60\text{s}$).
   - Verify attendant mobile devices report `SYNCED` with zero offline queue backlog.
3. **Trip Activation**: Attendant opens the trip on their mobile app and taps "Start Trip" upon departure from the school bus depot.

### B. Student Transit Operations
1. **Boarding at Assigned Stops**:
   - Each student taps their 13.56 MHz RFID card on the bus reader upon entering.
   - Screen displays immediate high-contrast visual confirmation (Green = Success).
   - If a duplicate tap occurs within 30 seconds, screen displays an Amber "DUPLICATE" warning. State remains intact.
   - If an unassigned student taps, screen displays a Red "WRONG BUS" alert and logs a critical exception.
2. **Stop Approaching & Arrival**:
   - As the bus approaches an assigned stop within $75\text{m}$, the system emits `BUS_REACHED_STOP`.
   - Students assigned to that stop transition from `ONBOARD` to `EXIT_PENDING`.
   - **Crucial Rule**: Students are NOT marked as exited merely because the bus is near the stop.
3. **Drop-Off Verification**:
   - Student taps their card to exit.
   - Attendant verifies visual confirmation (`EXIT_RECORDED`).
   - If 5 minutes elapse after reaching the stop and no exit tap occurs, the system automatically triggers an `EXIT_MISSING` exception.

---

## 2. Managing Operational Exceptions

The platform monitors 8 canonical exception types. Transport Managers must resolve each with a documented explanation.

| Exception Code | Severity | Trigger Condition | Operator Action |
| :--- | :--- | :--- | :--- |
| `WRONG_BUS` | `CRITICAL` | Student card tapped on unassigned bus/trip | Contact bus attendant immediately; verify student safety; coordinate handover. |
| `EXIT_MISSING` | `CRITICAL` | Student is `EXIT_PENDING` for $>5\text{ min}$ without exit tap | Verify whether student is sleeping or missed stop; check bus interior physically. |
| `WRONG_STOP_EXIT` | `CRITICAL` | Student exit scan occurred $>150\text{m}$ from assigned stop | Contact driver and guardian immediately; determine if authorized parent drop-off occurred. |
| `GPS_UNAVAILABLE` | `WARNING` | Vehicle GPS telemetry ceased updating ($>60\text{s}$) | Check vehicle ignition, antenna obstruction, or cellular SIM coverage. |
| `BOARDING_MISSING` | `WARNING` | Bus departed stop without assigned student | Contact parent to confirm whether student was absent from school today. |
| `DUPLICATE_SCAN` | `INFO` | Card tapped repeatedly within 30 seconds | Operator awareness only; no intervention needed. |
| `SYNC_FAILURE` | `WARNING` | Offline event rejected during batch flush | Check attendant app sync status; re-authenticate or manually override attendance. |
| `MANUAL_ATTENDANCE_OVERRIDE`| `INFO` | In-person attendance override recorded by staff | Review staff explanation and audit logs. |

---

## 3. Manual Attendance Override Procedure

Used strictly when a student forgot their card, card was damaged, or a parent picked up the student directly in-person:
1. Open the Admin Dashboard or Attendant App.
2. Locate the student on the active trip manifest.
3. Select "Manual Attendance Override".
4. Select the target status (`BOARDED` or `EXIT_RECORDED`).
5. **Enter a mandatory justification** (minimum 5 characters, e.g. "Collected in person by mother; verified via parent ID card").
6. Tap "Submit Override".
7. An immutable audit record is immediately appended to `audit_logs` with the actor's identity, timestamp, and justification.

---

## 4. Hardware Replacement & Decommissioning

### A. Replacing an Onboard RFID Reader
1. Navigate to **Fleet Management** $\rightarrow$ Select Target Bus.
2. Select **Replace RFID Reader**.
3. Enter the serial number of the new 13.56 MHz reader and the replacement reason (e.g. "Physical port failure").
4. Tap "Confirm Replacement".
5. The system automatically marks the previous reader as `DECOMMISSIONED`, preserves all historical scan records, activates the new reader, and updates `buses.active_rfid_device_id`.

### B. Replacing a GPS Telematics Unit
1. Navigate to **Fleet Management** $\rightarrow$ Select Target Bus.
2. Select **Replace GPS Unit**.
3. Enter the new unit IMEI and reason.
4. The system switches active tracking without erasing historical `gps_locations` telemetry.

---

## 5. Incident Response & Disaster Recovery

1. **Cellular Network Blackout**:
   - Mobile attendant devices continue operating seamlessly offline.
   - All scans buffer locally in SQLite with UUID v7 idempotency keys.
   - When network resumes, events flush automatically without data loss.
2. **Missing Child Protocol**:
   - Immediately check the **Exception Center** for `EXIT_MISSING` or `WRONG_BUS` alerts.
   - Review the child's last known coordinates and timeline on the Admin Journey Monitor.
   - Inspect vehicle live GPS coordinates and contact attendant directly.
