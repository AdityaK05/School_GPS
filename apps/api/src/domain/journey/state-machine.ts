import { JourneyState, JourneyEventType } from '@school-transport-platform/shared-types';

export interface StateTransitionResult {
  valid: boolean;
  previousState: JourneyState;
  nextState: JourneyState;
  reason?: string;
}

export class JourneyStateMachine {
  /**
   * Deterministically transitions journey state based on the incoming event.
   */
  public static transition(
    currentState: JourneyState,
    eventType: JourneyEventType,
    context?: { isAssignedExitStop?: boolean }
  ): StateTransitionResult {
    switch (eventType) {
      case 'TRIP_STARTED':
        if (currentState === 'EXPECTED') {
          return { valid: true, previousState: currentState, nextState: 'BOARDING_PENDING' };
        }
        return { valid: true, previousState: currentState, nextState: currentState };

      case 'STUDENT_BOARDING':
        if (currentState === 'EXPECTED' || currentState === 'BOARDING_PENDING') {
          return { valid: true, previousState: currentState, nextState: 'BOARDED' };
        }
        return {
          valid: false,
          previousState: currentState,
          nextState: currentState,
          reason: `Invalid transition: cannot BOARD from state ${currentState}`,
        };

      case 'BUS_LOCATION_UPDATE':
        // Progress boarded student to onboard
        if (currentState === 'BOARDED') {
          return { valid: true, previousState: currentState, nextState: 'ONBOARD' };
        }
        return { valid: true, previousState: currentState, nextState: currentState };

      case 'BUS_REACHED_STOP':
        // If bus reaches student's expected exit stop, prepare exit pending
        if (context?.isAssignedExitStop && (currentState === 'ONBOARD' || currentState === 'BOARDED')) {
          return { valid: true, previousState: currentState, nextState: 'EXIT_PENDING' };
        }
        return { valid: true, previousState: currentState, nextState: currentState };

      case 'STUDENT_EXIT':
        if (
          currentState === 'EXIT_PENDING' ||
          currentState === 'ONBOARD' ||
          currentState === 'BOARDED'
        ) {
          return { valid: true, previousState: currentState, nextState: 'EXIT_RECORDED' };
        }
        return {
          valid: false,
          previousState: currentState,
          nextState: currentState,
          reason: `Invalid transition: cannot EXIT from state ${currentState}`,
        };

      case 'TRIP_COMPLETED':
        if (currentState === 'EXIT_RECORDED') {
          return { valid: true, previousState: currentState, nextState: 'COMPLETED' };
        }
        return { valid: true, previousState: currentState, nextState: currentState };

      case 'MANUAL_ATTENDANCE_OVERRIDE':
        // Overrides are explicitly validated by the service layer
        return { valid: true, previousState: currentState, nextState: currentState };

      case 'DUPLICATE_RFID_SCAN':
      case 'GPS_OFFLINE':
      case 'GPS_RECOVERED':
        // Telemetry events do not alter student journey state
        return { valid: true, previousState: currentState, nextState: currentState };

      default:
        return { valid: true, previousState: currentState, nextState: currentState };
    }
  }
}
