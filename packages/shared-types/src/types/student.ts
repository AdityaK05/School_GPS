export interface Student {
  id: string;
  schoolId: string;

  admissionNumber: string;
  firstName: string;
  lastName: string;

  className?: string;
  section?: string;

  rfidCardId?: string;

  status: "ACTIVE" | "INACTIVE";

  createdAt?: string;
  updatedAt?: string;
  emergencyContact?: string | {
    name: string;
    phone: string;
    relationship: string;
  };
}