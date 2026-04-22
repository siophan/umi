import type {
  AdminCommunityCommentListResult,
  AdminCommunityPostListResult,
  AdminCommunityReportListResult,
  AdminLiveRoomListResult,
  StopAdminLiveRoomResult,
  DeleteAdminCommunityCommentResult,
  DeleteAdminCommunityPostResult,
  UpdateAdminCommunityReportPayload,
  UpdateAdminCommunityReportResult,
} from '@umi/shared';

import { deleteJson, getJson, putJson } from './shared';

type FetchAdminCommunityPostsParams = {
  title?: string;
  author?: string;
  tag?: string;
};

type FetchAdminCommunityCommentsParams = {
  content?: string;
  author?: string;
  postTitle?: string;
};

type FetchAdminCommunityReportsParams = {
  reporter?: string;
  reasonType?: string;
  targetKeyword?: string;
  status?: string;
};

type FetchAdminLiveRoomsParams = {
  title?: string;
  host?: string;
  guessTitle?: string;
};

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value?.trim()) {
      search.set(key, value.trim());
    }
  });
  return search.toString();
}

export function fetchAdminCommunityPosts(params: FetchAdminCommunityPostsParams) {
  const query = buildQuery(params);
  return getJson<AdminCommunityPostListResult>(
    `/api/admin/community/posts${query ? `?${query}` : ''}`,
  );
}

export function deleteAdminCommunityPost(id: string) {
  return deleteJson<DeleteAdminCommunityPostResult>(`/api/admin/community/posts/${id}`);
}

export function fetchAdminCommunityComments(params: FetchAdminCommunityCommentsParams) {
  const query = buildQuery(params);
  return getJson<AdminCommunityCommentListResult>(
    `/api/admin/community/comments${query ? `?${query}` : ''}`,
  );
}

export function deleteAdminCommunityComment(id: string) {
  return deleteJson<DeleteAdminCommunityCommentResult>(`/api/admin/community/comments/${id}`);
}

export function fetchAdminCommunityReports(params: FetchAdminCommunityReportsParams) {
  const query = buildQuery(params);
  return getJson<AdminCommunityReportListResult>(
    `/api/admin/community/reports${query ? `?${query}` : ''}`,
  );
}

export function updateAdminCommunityReport(
  id: string,
  payload: UpdateAdminCommunityReportPayload,
) {
  return putJson<UpdateAdminCommunityReportResult, UpdateAdminCommunityReportPayload>(
    `/api/admin/community/reports/${id}`,
    payload,
  );
}

export function fetchAdminLiveRooms(params: FetchAdminLiveRoomsParams) {
  const query = buildQuery(params);
  return getJson<AdminLiveRoomListResult>(`/api/admin/lives${query ? `?${query}` : ''}`);
}

export function stopAdminLiveRoom(id: string) {
  return putJson<StopAdminLiveRoomResult, Record<string, never>>(`/api/admin/lives/${id}/stop`, {});
}
