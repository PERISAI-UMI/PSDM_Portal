import { relations } from 'drizzle-orm';
import { fakultas, programStudi } from './academic.ts';
import { departments } from './departments.ts';
import { users } from './users.ts';
import { sessions, pjDepartments } from './system.ts';
import { activities } from './activities.ts';
import { activityCategories } from './activityCategories.ts';
import { attendances } from './attendances.ts';
import { permissions } from './permissions.ts';

export const fakultasRelations = relations(fakultas, ({ many }) => ({
  programStudi: many(programStudi),
}));

export const programStudiRelations = relations(programStudi, ({ one, many }) => ({
  fakultas: one(fakultas, {
    fields: [programStudi.fakultasId],
    references: [fakultas.id],
  }),
  users: many(users),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  pjDepartments: many(pjDepartments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  programStudi: one(programStudi, {
    fields: [users.programStudiId],
    references: [programStudi.id],
  }),
  sessions: many(sessions),
  pjDepartments: many(pjDepartments, { relationName: 'adminPj' }),
  createdActivities: many(activities, { relationName: 'activityCreator' }),
  attendances: many(attendances, { relationName: 'userAttendances' }),
  recordedAttendances: many(attendances, { relationName: 'recordedByAdmin' }),
  permissions: many(permissions, { relationName: 'userPermissions' }),
  reviewedPermissions: many(permissions, { relationName: 'reviewedByAdmin' }),
}));

export const pjDepartmentsRelations = relations(pjDepartments, ({ one }) => ({
  admin: one(users, {
    fields: [pjDepartments.adminId],
    references: [users.id],
    relationName: 'adminPj',
  }),
  department: one(departments, {
    fields: [pjDepartments.departmentId],
    references: [departments.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const activityCategoriesRelations = relations(activityCategories, ({ many }) => ({
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  category: one(activityCategories, {
    fields: [activities.categoryId],
    references: [activityCategories.id],
  }),
  creator: one(users, {
    fields: [activities.createdBy],
    references: [users.id],
    relationName: 'activityCreator',
  }),
  attendances: many(attendances),
  permissions: many(permissions),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  activity: one(activities, {
    fields: [attendances.activityId],
    references: [activities.id],
  }),
  user: one(users, {
    fields: [attendances.userId],
    references: [users.id],
    relationName: 'userAttendances',
  }),
  recorder: one(users, {
    fields: [attendances.recordedBy],
    references: [users.id],
    relationName: 'recordedByAdmin',
  }),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  user: one(users, {
    fields: [permissions.userId],
    references: [users.id],
    relationName: 'userPermissions',
  }),
  activity: one(activities, {
    fields: [permissions.activityId],
    references: [activities.id],
  }),
  reviewer: one(users, {
    fields: [permissions.reviewedBy],
    references: [users.id],
    relationName: 'reviewedByAdmin',
  }),
}));
