import { configureStore } from "@reduxjs/toolkit";
import Menureducer from '@/slice/menuSlice';

export const store = configureStore({
    reducer: {
        menu: Menureducer
    }
});