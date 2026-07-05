import { MOCK_MEMBERS } from "@/lib/beta/mocks";
import { saveMembers } from "@/lib/beta/storage";
import { saveWithWarning } from "./persist";
import { AppSliceCreator, MembersSlice } from "./types";

export const createMembersSlice: AppSliceCreator<MembersSlice> = (set) => ({
  members: MOCK_MEMBERS,

  updateMember: (updated) => {
    set((state) => {
      const members = state.members.map((member) =>
        member.id === updated.id ? updated : member
      );
      saveWithWarning("members", saveMembers(members));
      return { members };
    });
  },
});
