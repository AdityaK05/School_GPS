export interface Route {
  id: string;
  schoolId: string;

  name: string;
  code: string;

  direction: "MORNING" | "EVENING";

  status: "ACTIVE" | "INACTIVE";
}