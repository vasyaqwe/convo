import { create } from "zustand"

type StoreState = {
    members: string[]
    addMember: (id: string) => void
    removeMember: (id: string) => void
    setMembers: (ids: string[]) => void
}

export const useActiveUsersStore = create<StoreState>()((set, get) => ({
    members: [],
    addMember: (id) => {
        if (!get().members.includes(id)) {
            set((state) => ({ members: [...state.members, id] }))
        }
    },
    removeMember: (id) =>
        set((state) => ({
            members: state.members.filter((memberId) => memberId !== id),
        })),
    setMembers: (ids) => set({ members: ids }),
}))
