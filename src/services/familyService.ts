import { getFamilies, getFamilyDetail, joinFamily, createFamily } from '../api/familyApi';

const listFrom = (value: any, key: string) => {
  const target = key && value?.[key] !== undefined ? value[key] : value;
  if (Array.isArray(target)) return target;
  return target?.content ?? target?.data ?? target?.items ?? [];
};

const normalizeFamily = (f: any, idx: number) => ({
  id: f?.id ?? f?.familyGroupId ?? `family-${idx}`,
  name: f?.name ?? f?.familyName ?? 'Family',
  announcement: f?.description ?? f?.announcement ?? '',
  icon: f?.iconUrl ?? f?.icon ?? f?.coverUrl ?? null,
  members: f?.memberCount ?? f?.members ?? 0,
  level: f?.level ?? 1,
  tag: f?.tag ?? null,
  owner: Boolean(f?.owner ?? f?.isOwner),
  member: Boolean(f?.member ?? f?.isMember),
});

export const loadFamilyLists = async () => {
  try {
    const data = await getFamilies();
    const existing = listFrom(data, 'existingFamilies').map((f: any, i: number) => normalizeFamily(f, i));
    const created = listFrom(data, 'newFamilies').map((f: any, i: number) => normalizeFamily(f, i));
    return { existingFamilies: existing, newFamilies: created };
  } catch {
    return { existingFamilies: [], newFamilies: [] };
  }
};

export const loadFamilyDetail = async (id: string | number) => {
  const data = await getFamilyDetail(id);
  return normalizeFamily(data, 0);
};

export const joinFamilyGroup = async (id: string | number) => {
  return joinFamily(id);
};

export const createFamilyGroup = async (body: any) => {
  return createFamily(body);
};

export default {
  loadFamilyLists,
  loadFamilyDetail,
  joinFamilyGroup,
  createFamilyGroup,
};
