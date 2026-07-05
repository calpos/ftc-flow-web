import { saveEvents } from "@/lib/beta/storage";
import { saveWithWarning } from "./persist";
import { AppSliceCreator, EventsSlice } from "./types";

export const createEventsSlice: AppSliceCreator<EventsSlice> = (set) => ({
  events: [],

  addEvent: (event) => {
    set((state) => {
      const events = [...state.events, event];
      saveWithWarning("events", saveEvents(events));
      return { events };
    });
  },

  updateEvent: (event) => {
    set((state) => {
      const events = state.events.map((item) => (item.id === event.id ? event : item));
      saveWithWarning("events", saveEvents(events));
      return { events };
    });
  },

  deleteEvent: (eventId) => {
    set((state) => {
      const events = state.events.filter((event) => event.id !== eventId);
      saveWithWarning("events", saveEvents(events));
      return { events };
    });
  },
});
