import { create } from "zustand"

type StoreState = {
    members: string[]
    addMember: (id: string) => void
    removeMember: (id: string) => void
    setMembers: (ids: string[]) => void
}

export const useActiveUsersStore = create<StoreState>()((set) => ({
    members: [],
    addMember: (id) => set((state) => ({ members: [...state.members, id] })),
    removeMember: (id) =>
        set((state) => ({
            members: state.members.filter((memberId) => memberId !== id),
        })),
    setMembers: (ids) => set({ members: ids }),
}))
