import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    notifications: [],
    alerts: [],
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
    },
    addAlert: (state, action) => {
      state.alerts.unshift(action.payload);
    },
    clearAlerts: (state) => { state.alerts = []; },
  },
});

export const { toggleSidebar, addNotification, addAlert, clearAlerts } = uiSlice.actions;
export default uiSlice.reducer;
