export interface Notification {
  id: string;

  userId: string;
  schoolId: string;

  type:
    | "BOARDING"
    | "EXIT"
    | "BUS_APPROACHING"
    | "DELAY"
    | "EXCEPTION";

  title: string;
  body: string;

  readAt?: string;

  createdAt: string;
}