import { create } from "zustand"

// Store liviano para estado de UI transversal
// formDirty: true cuando hay un formulario con datos sin guardar
const storeUI = create((set) => ({
    formDirty: false,
    setFormDirty: (val) => set({ formDirty: val }),
}))

export default storeUI