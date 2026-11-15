import { Student, StudentRouteAssignment } from '@school-transport-platform/shared-types';
import { IStudentRepository } from '../../repositories/interfaces';
import { AuditService } from '../audit/audit.service';
import crypto from 'crypto';

export class StudentService {
  constructor(
    private studentRepo: IStudentRepository,
    private auditService: AuditService
  ) {}

  public async createStudent(params: {
    schoolId: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    className?: string;
    section?: string;
    rfidCardId?: string;
  }): Promise<Student> {
    const student: Student = {
      id: crypto.randomUUID(),
      schoolId: params.schoolId,
      admissionNumber: params.admissionNumber,
      firstName: params.firstName,
      lastName: params.lastName,
      className: params.className,
      section: params.section,
      rfidCardId: params.rfidCardId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return await this.studentRepo.create(student);
  }

  public async assignRoute(params: {
    studentId: string;
    routeId: string;
    stopId: string;
    effectiveFrom: string;
    actorUserId?: string;
  }): Promise<StudentRouteAssignment> {
    const student = await this.studentRepo.findById(params.studentId);
    if (!student) throw new Error(`Student ${params.studentId} not found`);

    const existingAssignment = await this.studentRepo.findAssignment(params.studentId);
    if (existingAssignment) {
      await this.studentRepo.updateAssignment(existingAssignment.id, { status: 'INACTIVE' });
    }

    const assignment: StudentRouteAssignment = {
      id: crypto.randomUUID(),
      studentId: params.studentId,
      routeId: params.routeId,
      stopId: params.stopId,
      effectiveFrom: params.effectiveFrom,
      status: 'ACTIVE',
    };

    const created = await this.studentRepo.createAssignment(assignment);

    await this.auditService.log(
      student.schoolId,
      params.actorUserId,
      'STUDENT_ROUTE_ASSIGNED',
      'student_route_assignments',
      created.id,
      { previousAssignmentId: existingAssignment?.id },
      { assignmentId: created.id, routeId: params.routeId, stopId: params.stopId },
      `Assigned route ${params.routeId} and stop ${params.stopId} to student ${student.admissionNumber}`
    );

    return created;
  }

  public async assignCard(studentId: string, rfidCardId: string, actorUserId?: string): Promise<Student> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) throw new Error(`Student ${studentId} not found`);

    const updated = await this.studentRepo.update(studentId, {
      rfidCardId,
      updatedAt: new Date().toISOString(),
    });

    await this.auditService.log(
      student.schoolId,
      actorUserId,
      'STUDENT_RFID_ASSIGNED',
      'students',
      student.id,
      { previousRfidCardId: student.rfidCardId },
      { rfidCardId },
      `Assigned RFID card token to student ${student.admissionNumber}`
    );

    return updated;
  }
}
