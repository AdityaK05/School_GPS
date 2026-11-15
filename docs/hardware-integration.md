# Hardware & Device Integration Guide
**School Transport Safety & Accountability Platform**

This document specifies the hardware standards, telematics ingestion protocols, RFID reader interfaces, and simulator tools used for integrating vehicles and contactless smart cards with the platform.

---

## 1. GPS Telematics Specifications

### A. Telemetry Requirements
- **Frequency**: Configured to transmit every $5\text{ to }15\text{ seconds}$ while the vehicle ignition is on.
- **Freshness Window (ADR-8)**: The platform enforces a strict $60\text{-second}$ freshness window (`THRESHOLDS.GPS_FRESHNESS_SECONDS = 60`).
- **Telemetry Payload Parameters**:
  - `latitude`: WGS 84 decimal degrees $[-90.0, 90.0]$
  - `longitude`: WGS 84 decimal degrees $[-180.0, 180.0]$
  - `speed`: Speed over ground in $\text{km/h}$
  - `heading`: Course over ground in degrees $[0, 360]$
  - `accuracy`: Horizontal dilution of precision (HDOP) or meter radius
  - `recordedAt`: Hardware GPS fix timestamp (UTC ISO 8601)

### B. Supported Telematics Adapters
1. **Generic JSON Gateway (`GenericJsonGpsAdapter`)**:
   - Ingests standard HTTP REST/Webhook payloads from enterprise gateways (e.g. Concox, Queclink, CalAmp).
2. **Teltonika AVL Adapter (`TeltonikaGpsAdapter`)**:
   - Ingests Teltonika AVL protocol data (e.g. FMB920, FMB120, FMC130).
   - Converts integer microdegrees into standard decimal coordinates.
   - Extracts ignition status, external voltage, and satellite counts.

---

## 2. RFID Reader Specifications

### A. Contactless Smart Card Standard (ADR-9, ADR-10)
- **Radio Frequency**: $13.56\text{ MHz}$ High Frequency (HF).
- **Physical Protocol**: ISO/IEC 14443 Type A or Type B contactless smart cards (e.g. MIFARE Classic EV1, NTAG213, MIFARE Ultralight, or DESFire EV2/EV3).
- **UID Format**: 4-byte or 7-byte unique hardware identifiers mapped to opaque platform tokens.
- **Onboard Reader Hardware**:
  - USB or Serial readers (e.g. Advanced Card Systems ACR122U, Identiv uTrust, or industrial RS-485 bus scanners).
  - Enforces **exactly one active RFID reader per bus** at any time.

---

## 3. Development Simulators

For development, testing, and continuous integration environments where physical vehicles or smart cards are unavailable, deterministic simulators are provided in `apps/api/src/domain/hardware/simulators/`:

### A. GPS Simulator (`GPSSimulator`)
```typescript
import { GPSSimulator } from '../apps/api/src/domain/hardware/simulators/gps.simulator';

const simulator = new GPSSimulator('GPS_BUS_101', 12.9352, 77.6245);

// 1. Generate normal live fix
const livePoint = simulator.generatePoint({ mode: 'NORMAL', speed: 30 });

// 2. Simulate stale telemetry (> 60s)
const stalePoint = simulator.generatePoint({ mode: 'STALE', staleAgeSeconds: 120 });

// 3. Simulate recovery after outage
const recoveryPoint = simulator.generatePoint({ mode: 'RECOVERY' });

// 4. Simulate malformed/corrupted packet
const malformedPoint = simulator.generatePoint({ mode: 'MALFORMED' });
```

### B. RFID Simulator (`RFIDSimulator`)
```typescript
import { RFIDSimulator } from '../apps/api/src/domain/hardware/simulators/rfid.simulator';

const simulator = new RFIDSimulator('READER_BUS_101');

// 1. Generate boarding tap
const boardingScan = simulator.generateScan({
  readerHardwareId: 'READER_BUS_101',
  cardToken: 'CARD_TOK_STUDENT_01',
  mode: 'BOARDING',
});

// 2. Generate exit tap
const exitScan = simulator.generateScan({
  readerHardwareId: 'READER_BUS_101',
  cardToken: 'CARD_TOK_STUDENT_01',
  mode: 'EXIT',
});
```
