export interface Guardian {
  id: string;
  userId: string;
  studentId: string;

  relationship: "FATHER" | "MOTHER" | "GUARDIAN";

  notificationEnabled?: boolean;
  isEmergencyContact?: boolean;
  canPickup?: boolean;
  createdAt?: string;
}