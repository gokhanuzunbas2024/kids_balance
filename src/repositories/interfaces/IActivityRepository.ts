import { Activity, CreateActivityDTO, UpdateActivityDTO, QueryOptions } from '@/types';

export interface IActivityRepository {
  getById(id: string): Promise<Activity | null>;
  getByFamilyId(familyId: string, options?: QueryOptions): Promise<Activity[]>;
  getActiveByFamilyId(familyId: string): Promise<Activity[]>;
  getByCategory(familyId: string, category: string): Promise<Activity[]>;
  create(data: CreateActivityDTO & { id: string }): Promise<Activity>;
  update(id: string, data: UpdateActivityDTO): Promise<Activity>;
  delete(id: string): Promise<void>;
  seedDefaults(familyId: string, createdBy: string): Promise<void>;
}
