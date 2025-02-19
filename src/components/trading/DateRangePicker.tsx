'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

interface DateRangePickerProps {
  startDate: Date
  endDate: Date
  onDateChange: (start: Date, end: Date) => void
}

export default function DateRangePicker({ startDate, endDate, onDateChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <span className="mr-2 text-sm text-gray-600">From:</span>
        <DatePicker
          selected={startDate}
          onChange={(date: Date) => onDateChange(date, endDate)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          maxDate={endDate}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center">
        <span className="mr-2 text-sm text-gray-600">To:</span>
        <DatePicker
          selected={endDate}
          onChange={(date: Date) => onDateChange(startDate, date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          maxDate={new Date()}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
} 