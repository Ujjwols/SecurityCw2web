import React, { useState } from 'react';
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Interface for events (matches Dashboard's Event interface)
interface Event {
  _id: string;
  title: string;
  date?: string;
  time?: string;
  location?: string;
  description: string;
  files?: { url: string; type: string }[];
}

// Props interface for NepaliCalendar
interface NepaliCalendarProps {
  events: Event[];
  onDateClick: (date: string) => Promise<void>;
}

const NepaliCalendar: React.FC<NepaliCalendarProps> = ({ events, onDateClick }) => {
  // State for current month and year (start with May 2025)
  const [currentDate, setCurrentDate] = useState(new Date(2025, 4, 1)); // May 1, 2025

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  // Calculate calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);
  const startingDay = getDay(firstDayOfMonth); // 0 (Sun) to 6 (Sat)

  // Helper to check if a date has events
  const hasEventOnDate = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return events.some(
      (event) => event.date && format(new Date(event.date), 'yyyy-MM-dd') === formattedDate
    );
  };

  // Generate calendar days
  const calendarDays = [];
  // Add empty slots for days before the first day of the month
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-10"></div>);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDay = new Date(year, month, day);
    const isEventDay = hasEventOnDate(currentDay);
    calendarDays.push(
      <div
        key={day}
        className={`h-10 flex items-center justify-center cursor-pointer rounded-full ${
          isEventDay ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'
        }`}
        onClick={() => onDateClick(currentDay.toISOString())}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')} {/* e.g., "May 2025" */}
        </h2>
        <Button variant="outline" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="font-medium text-gray-700">
            {day}
          </div>
        ))}
        {calendarDays}
      </div>
    </div>
  );
};

export default NepaliCalendar;