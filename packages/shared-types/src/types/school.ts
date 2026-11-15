export interface School {
  id: string;
  name: string;
  code: string;
  timezone: string;
  address?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}