import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import {
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Building2,
  FileText,
  ArrowRight,
  Activity,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckSquare,
  AlertTriangle,
  Trash2,
  Edit,
  RefreshCw,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { format, addDays, isSameDay, startOfWeek, addWeeks, subWeeks, isToday, parseISO, isAfter, isBefore, endOfDay, startOfDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from 'date-fns';
import { NewAppointmentForm } from './NewAppointmentForm';

// Department names mapping
const departmentNames: Record<string, string> = {
  'general-consultation': 'General Consultation',
  'pediatrics': 'Pediatrics',
  'dental': 'Dental',
  'gynecology': 'Gynecology',
  'orthopedic': 'Orthopedic',
  'cardiology': 'Cardiology',
  'neurology': 'Neurology',
  'ophthalmology': 'Ophthalmology',
  'dermatology': 'Dermatology',
  'ent': 'ENT',
  'psychiatry': 'Psychiatry',
  'urology': 'Urology'
};

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  time: string;
  department: string;
  doctor: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  notes?: string;
  type: 'follow-up' | 'new-visit' | 'consultation' | 'procedure';
  contactNumber?: string;
  email?: string;
  createdAt?: Date;
}

export const AppointmentScheduler = () => {
  const { hospital } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = React.useRef<HTMLDivElement>(null);
  
  // Mock appointments data
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      patientId: '123',
      patientName: 'John Doe',
      date: new Date(),
      time: '09:00',
      department: 'general-consultation',
      doctor: 'Dr. Sarah Chen',
      status: 'scheduled',
      type: 'new-visit',
      contactNumber: '+254 712 345 678',
      email: 'john.doe@example.com',
      createdAt: new Date(Date.now() - 86400000) // yesterday
    },
    {
      id: '2',
      patientId: '124',
      patientName: 'Jane Smith',
      date: new Date(),
      time: '10:30',
      department: 'pediatrics',
      doctor: 'Dr. Michael Brown',
      status: 'completed',
      type: 'follow-up',
      contactNumber: '+254 723 456 789',
      email: 'jane.smith@example.com',
      createdAt: new Date(Date.now() - 172800000) // 2 days ago
    },
    {
      id: '3',
      patientId: '125',
      patientName: 'Robert Johnson',
      date: addDays(new Date(), 1),
      time: '14:00',
      department: 'dental',
      doctor: 'Dr. Emily White',
      status: 'scheduled',
      type: 'procedure',
      contactNumber: '+254 734 567 890',
      email: 'robert.johnson@example.com',
      createdAt: new Date(Date.now() - 259200000) // 3 days ago
    },
    {
      id: '4',
      patientId: '126',
      patientName: 'Sarah Williams',
      date: addDays(new Date(), 2),
      time: '11:15',
      department: 'gynecology',
      doctor: 'Dr. Lisa Anderson',
      status: 'scheduled',
      type: 'consultation',
      contactNumber: '+254 745 678 901',
      email: 'sarah.williams@example.com',
      createdAt: new Date(Date.now() - 345600000) // 4 days ago
    },
    {
      id: '5',
      patientId: '127',
      patientName: 'Michael Brown',
      date: addDays(new Date(), -1),
      time: '15:30',
      department: 'orthopedic',
      doctor: 'Dr. James Wilson',
      status: 'cancelled',
      type: 'follow-up',
      contactNumber: '+254 756 789 012',
      email: 'michael.brown@example.com',
      createdAt: new Date(Date.now() - 432000000) // 5 days ago
    }
  ]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate stats based on appointments
  const stats = React.useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(addDays(today, 1));
    
    return {
      today: appointments.filter(a => 
        isSameDay(new Date(a.date), new Date()) && 
        (selectedDepartment === 'all' || a.department === selectedDepartment)
      ).length,
      tomorrow: appointments.filter(a => 
        isSameDay(new Date(a.date), addDays(new Date(), 1)) && 
        (selectedDepartment === 'all' || a.department === selectedDepartment)
      ).length,
      scheduled: appointments.filter(a => 
        a.status === 'scheduled' && 
        isAfter(new Date(a.date), today) &&
        (selectedDepartment === 'all' || a.department === selectedDepartment)
      ).length,
      completed: appointments.filter(a => 
        a.status === 'completed' && 
        (selectedDepartment === 'all' || a.department === selectedDepartment)
      ).length,
      cancelled: appointments.filter(a => 
        a.status === 'cancelled' && 
        (selectedDepartment === 'all' || a.department === selectedDepartment)
      ).length
    };
  }, [appointments, selectedDepartment]);

  // Filter appointments based on selected date, department, and search query
  const filteredAppointments = React.useMemo(() => {
    return appointments.filter(appointment => {
      const matchesSearch = appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           appointment.doctor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || appointment.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
      
      let matchesDate = false;
      if (viewMode === 'day') {
        matchesDate = isSameDay(new Date(appointment.date), selectedDate);
      } else if (viewMode === 'week') {
        const weekStart = startOfWeek(currentWeek);
        const weekEnd = addDays(weekStart, 6);
        matchesDate = isAfter(new Date(appointment.date), weekStart) && 
                     isBefore(new Date(appointment.date), endOfDay(weekEnd));
      } else if (viewMode === 'month') {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        matchesDate = isAfter(new Date(appointment.date), monthStart) && 
                     isBefore(new Date(appointment.date), endOfDay(monthEnd));
      }
      
      return matchesSearch && matchesDepartment && matchesStatus && matchesDate;
    }).sort((a, b) => {
      // First sort by date
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // Then sort by time
      return a.time.localeCompare(b.time);
    });
  }, [appointments, searchQuery, selectedDepartment, selectedStatus, selectedDate, viewMode, currentWeek, currentMonth]);

  // Get time slots for the day view
  const timeSlots = React.useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => {
      const hour = 9 + i;
      return `${hour.toString().padStart(2, '0')}:00`;
    });
  }, []);

  // Get days for the week view
  const weekDays = React.useMemo(() => {
    const weekStart = startOfWeek(currentWeek);
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentWeek]);

  // Get days for the month view
  const monthDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentMonth]);

  const handleNewAppointment = (appointment: Appointment) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAppointments([...appointments, appointment]);
      setIsLoading(false);
    }, 800);
  };

  const handleStatusChange = (appointmentId: string, newStatus: Appointment['status']) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAppointments(appointments.map(appointment =>
        appointment.id === appointmentId
          ? { ...appointment, status: newStatus }
          : appointment
      ));
      setIsLoading(false);
      setShowAppointmentDetails(false);
    }, 800);
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setAppointments(appointments.filter(a => a.id !== appointmentId));
        setIsLoading(false);
        setShowAppointmentDetails(false);
      }, 800);
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getTypeColor = (type: Appointment['type']) => {
    switch (type) {
      case 'follow-up':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'procedure':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'new-visit':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const renderDayView = () => {
    return (
      <div className="divide-y">
        {timeSlots.map((time) => {
          const slotAppointments = filteredAppointments.filter(a => a.time === time);
          
          return (
            <div key={time} className="p-4 hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium text-gray-500">{time}</div>
                <div className="flex-1">
                  {slotAppointments.length > 0 ? (
                    <div className="flex items-center gap-4">
                      {slotAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className={`flex-1 p-4 rounded-lg border ${getStatusColor(appointment.status)} cursor-pointer hover:shadow-md transition-all`}
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowAppointmentDetails(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                <span className="text-lg font-medium text-blue-600">
                                  {appointment.patientName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {appointment.patientName}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(appointment.type)}`}>
                                    {appointment.type.replace('-', ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {appointment.status === 'scheduled' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(appointment.id, 'completed');
                                    }}
                                    className="p-1.5 hover:bg-green-100 rounded text-green-600"
                                    title="Mark as completed"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(appointment.id, 'cancelled');
                                    }}
                                    className="p-1.5 hover:bg-red-100 rounded text-red-600"
                                    title="Cancel appointment"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAppointment(appointment);
                                  setShowAppointmentDetails(true);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4" />
                              <span>{departmentNames[appointment.department]}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              <span>{appointment.doctor}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedTime(time);
                        setShowNewAppointment(true);
                      }}
                      className="w-full h-16 border border-dashed rounded-lg flex items-center justify-center text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      Available slot - Click to schedule
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day, index) => (
              <div 
                key={index} 
                className={`p-2 text-center ${
                  isToday(day) 
                    ? 'bg-blue-50 text-blue-700 rounded-lg font-medium' 
                    : 'text-gray-500'
                }`}
              >
                <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                <div className={`text-lg ${isToday(day) ? 'text-blue-700' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
          
          {/* Time slots */}
          <div className="space-y-2">
            {timeSlots.map(time => (
              <div key={time} className="grid grid-cols-7 gap-2">
                {weekDays.map((day, dayIndex) => {
                  const dayAppointments = filteredAppointments.filter(a => 
                    isSameDay(new Date(a.date), day) && a.time === time
                  );
                  
                  return (
                    <div 
                      key={dayIndex} 
                      className={`p-2 border rounded-lg min-h-[80px] ${
                        isToday(day) ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">{time}</div>
                      {dayAppointments.length > 0 ? (
                        <div className="space-y-1">
                          {dayAppointments.map(appointment => (
                            <div 
                              key={appointment.id}
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowAppointmentDetails(true);
                              }}
                              className={`p-2 rounded text-xs cursor-pointer ${getStatusColor(appointment.status)}`}
                            >
                              <div className="font-medium truncate">{appointment.patientName}</div>
                              <div className="text-xs opacity-80 truncate">{appointment.doctor}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedDate(day);
                            setSelectedTime(time);
                            setShowNewAppointment(true);
                          }}
                          className="w-full h-full flex items-center justify-center text-xs text-gray-400 hover:text-blue-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    // Calculate the first day of the month to determine offset
    const firstDayOfMonth = startOfMonth(currentMonth);
    const startDayOfWeek = getDay(firstDayOfMonth); // 0 = Sunday, 1 = Monday, etc.
    
    // Create an array of days including empty slots for proper alignment
    const calendarDays = [...Array(startDayOfWeek).fill(null), ...monthDays];
    
    return (
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-24 p-1" />;
            }
            
            const dayAppointments = filteredAppointments.filter(a => 
              isSameDay(new Date(a.date), day)
            );
            
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            
            return (
              <div 
                key={index}
                className={`h-24 p-1 border ${
                  isToday(day) 
                    ? 'border-blue-300 bg-blue-50' 
                    : isSelected
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-100'
                } ${!isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <button
                    onClick={() => {
                      setSelectedDate(day);
                      setViewMode('day');
                    }}
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-sm ${
                      isToday(day) 
                        ? 'bg-blue-600 text-white' 
                        : isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                  
                  {dayAppointments.length > 0 && (
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {dayAppointments.length}
                    </span>
                  )}
                </div>
                
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px]">
                  {dayAppointments.slice(0, 2).map(appointment => (
                    <div 
                      key={appointment.id}
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowAppointmentDetails(true);
                      }}
                      className={`px-1.5 py-0.5 rounded text-xs cursor-pointer truncate ${getStatusColor(appointment.status)}`}
                    >
                      {appointment.time} {appointment.patientName.split(' ')[0]}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-center text-gray-500">
                      +{dayAppointments.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 bg-white border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedDepartment === 'all' 
                  ? 'Appointment Scheduler'
                  : `${departmentNames[selectedDepartment]} Appointments`
                }
              </h1>
              <p className="text-gray-500 mt-1">Manage patient appointments</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedTime(undefined);
              setShowNewAppointment(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stats.today}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tomorrow's Appointments</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stats.tomorrow}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 border border-green-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stats.scheduled}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-xl p-4 border border-red-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-lg font-semibold text-gray-900 flex items-center gap-2 hover:text-blue-600 transition-colors"
              >
                {viewMode === 'day' 
                  ? format(selectedDate, 'MMMM d, yyyy')
                  : viewMode === 'week'
                  ? `Week of ${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`
                  : format(currentMonth, 'MMMM yyyy')
                }
                <ChevronDown className="w-5 h-5" />
              </button>
              
              {showCalendar && (
                <div 
                  ref={calendarRef}
                  className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border z-10 p-4 w-72"
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        if (viewMode === 'month') {
                          setCurrentMonth(subMonths(currentMonth, 1));
                        } else if (viewMode === 'week') {
                          setCurrentWeek(subWeeks(currentWeek, 1));
                        } else {
                          setSelectedDate(subMonths(selectedDate, 1));
                        }
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-sm font-medium">
                      {viewMode === 'month' 
                        ? format(currentMonth, 'MMMM yyyy')
                        : viewMode === 'week'
                        ? `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d')}`
                        : format(selectedDate, 'MMMM yyyy')
                      }
                    </h3>
                    <button
                      onClick={() => {
                        if (viewMode === 'month') {
                          setCurrentMonth(addMonths(currentMonth, 1));
                        } else if (viewMode === 'week') {
                          setCurrentWeek(addWeeks(currentWeek, 1));
                        } else {
                          setSelectedDate(addMonths(selectedDate, 1));
                        }
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                      <div key={day} className="text-center text-xs text-gray-500 font-medium">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {eachDayOfInterval({
                      start: startOfMonth(viewMode === 'month' ? currentMonth : selectedDate),
                      end: endOfMonth(viewMode === 'month' ? currentMonth : selectedDate)
                    }).map((day, i) => {
                      const dayOfWeek = getDay(day);
                      // Add empty cells for days before the first of the month
                      if (i === 0) {
                        const emptyDays = [];
                        for (let j = 0; j < dayOfWeek; j++) {
                          emptyDays.push(
                            <div key={`empty-${j}`} className="h-8" />
                          );
                        }
                        return [
                          ...emptyDays,
                          <button
                            key={day.toString()}
                            onClick={() => {
                              setSelectedDate(day);
                              setViewMode('day');
                              setShowCalendar(false);
                            }}
                            className={`h-8 rounded-full flex items-center justify-center text-sm ${
                              isToday(day)
                                ? 'bg-blue-600 text-white'
                                : isSameDay(day, selectedDate)
                                ? 'bg-blue-100 text-blue-700'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {format(day, 'd')}
                          </button>
                        ];
                      }
                      
                      return (
                        <button
                          key={day.toString()}
                          onClick={() => {
                            setSelectedDate(day);
                            setViewMode('day');
                            setShowCalendar(false);
                          }}
                          className={`h-8 rounded-full flex items-center justify-center text-sm ${
                            isToday(day)
                              ? 'bg-blue-600 text-white'
                              : isSameDay(day, selectedDate)
                              ? 'bg-blue-100 text-blue-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t flex justify-center">
                    <button
                      onClick={() => {
                        setSelectedDate(new Date());
                        setCurrentWeek(startOfWeek(new Date()));
                        setCurrentMonth(startOfMonth(new Date()));
                        setShowCalendar(false);
                      }}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      Today
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              {[
                { id: 'day', label: 'Day' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id as typeof viewMode)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    viewMode === id
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (viewMode === 'week') {
                    setCurrentWeek(subWeeks(currentWeek, 1));
                  } else if (viewMode === 'month') {
                    setCurrentMonth(subMonths(currentMonth, 1));
                  } else {
                    setSelectedDate(addDays(selectedDate, -1));
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setCurrentWeek(startOfWeek(new Date()));
                  setCurrentMonth(startOfMonth(new Date()));
                }}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                Today
              </button>
              <button
                onClick={() => {
                  if (viewMode === 'week') {
                    setCurrentWeek(addWeeks(currentWeek, 1));
                  } else if (viewMode === 'month') {
                    setCurrentMonth(addMonths(currentMonth, 1));
                  } else {
                    setSelectedDate(addDays(selectedDate, 1));
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search appointments..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {Object.entries(departmentNames).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="in-progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </div>

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <NewAppointmentForm
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onClose={() => setShowNewAppointment(false)}
          onSubmit={handleNewAppointment}
        />
      )}

      {/* Appointment Details Modal */}
      {showAppointmentDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Appointment Details</h2>
                  <p className="text-sm text-gray-500">
                    {format(new Date(selectedAppointment.date), 'MMMM d, yyyy')} at {selectedAppointment.time}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAppointmentDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAppointment.status)}`}>
                  {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedAppointment.type)}`}>
                  {selectedAppointment.type.replace('-', ' ').charAt(0).toUpperCase() + selectedAppointment.type.replace('-', ' ').slice(1)}
                </span>
              </div>

              {/* Patient Information */}
              <div className="bg-gray-50 rounded-xl p-5 border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Patient Information</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedAppointment.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Patient ID</p>
                    <p className="font-medium">{selectedAppointment.patientId}</p>
                  </div>
                  
                  {selectedAppointment.contactNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Contact Number</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="font-medium">{selectedAppointment.contactNumber}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedAppointment.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="font-medium">{selectedAppointment.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-gray-50 rounded-xl p-5 border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Appointment Details</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{departmentNames[selectedAppointment.department]}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Doctor</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{selectedAppointment.doctor}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{format(new Date(selectedAppointment.date), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <div className="flex items-center gap-2 mt-1">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{selectedAppointment.time}</p>
                    </div>
                  </div>
                </div>
                
                {selectedAppointment.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}
                
                {selectedAppointment.createdAt && (
                  <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                    Appointment created on {format(new Date(selectedAppointment.createdAt), 'MMMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-between">
              <div>
                {selectedAppointment.status === 'scheduled' && (
                  <button
                    onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAppointmentDetails(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Close
                </button>
                
                {selectedAppointment.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedAppointment.id, 'cancelled')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>Cancel</span>
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange(selectedAppointment.id, 'completed')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Mark as Completed</span>
                    </button>
                  </>
                )}
                
                {selectedAppointment.status === 'cancelled' && (
                  <button
                    onClick={() => handleStatusChange(selectedAppointment.id, 'scheduled')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>Reschedule</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};