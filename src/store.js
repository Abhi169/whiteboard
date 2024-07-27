import { configureStore } from "@reduxjs/toolkit";
import Menureducer from '@/slice/menuSlice';
import ToolboxReducer from "@/slice/toolboxSlice";

export const store = configureStore({
    reducer: {
        menu: Menureducer,
        toolbox: ToolboxReducer
    }
});