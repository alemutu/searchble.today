import React, { useState } from 'react';
import { X, Calendar, Clock, Users, Building2, FileText, User, Phone, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

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

// Mock doctors data
const doctors = {
  'general-consultation': ['Dr. Sarah Chen', 'Dr. James Wilson', 'Dr. Maria Rodriguez'],
  'pediatrics': ['Dr. Michael Brown', 'Dr. Emily Johnson', 'Dr. David Lee'],
  'dental': ['Dr. Emily White', 'Dr. Robert Garcia', 'Dr. Lisa Chen'],
  'gynecology': ['Dr. Lisa Anderson', 'Dr. Jennifer Kim', 'Dr. Sophia Martinez'],
  'orthopedic': ['Dr. James Wilson', 'Dr. Thomas Wright', 'Dr. Robert Johnson'],
  'cardiology': ['Dr. William Chen', 'Dr. Elizabeth Taylor', 'Dr. Richard Davis'],
  'neurology': ['Dr. John Smith', 'Dr. Patricia Brown', 'Dr. Michael Wilson'],
  'ophthalmology': ['Dr. Susan Lee', 'Dr. Daniel White', 'Dr. Karen Johnson'],
  'dermatology': ['Dr. Jessica Miller', 'Dr. Christopher Davis', 'Dr. Amanda Wilson'],
  'ent': ['Dr. Robert Taylor', 'Dr. Mary Johnson', 'Dr. Charles Garcia'],
  'psychiatry': ['Dr. Sarah Miller', 'Dr. David Brown', 'Dr. Jennifer Davis'],
  'urology': ['Dr. Thomas Anderson', 'Dr. Margaret Wilson', 'Dr. Joseph Martinez']
};

// Time slots
const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

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

interface NewAppointmentFormProps {
  selectedDate?: Date;
  selectedTime?: string;
  onClose: () => void;
  onSubmit: (appointment: Appointment) => void;
}

export const NewAppointmentForm: React.FC<NewAppointmentFormProps> = ({
  selectedDate = new Date(),
  selectedTime,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    date: selectedDate,
    time: selectedTime || '09:00',
    department: 'general-consultation',
    doctor: doctors['general-consultation'][0],
    notes: '',
    type: 'consultation',
    contactNumber: '',
    email: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Update doctor when department changes
    if (name === 'department') {
      setFormData(prev => ({
        ...prev,
        doctor: doctors[value as keyof typeof doctors][0]
      }));
    }
  };
  
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }
    
    if (!formData.patientId.trim()) {
      newErrors.patientId = 'Patient ID is required';
    }
    
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (!formData.doctor) {
      newErrors.doctor = 'Doctor is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Appointment type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };
  
  const handlePrevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (step === 3) {
      setIsSubmitting(true);
      
      // Create appointment object
      const newAppointment: Appointment = {
        id: Math.random().toString(36).substring(2, 11),
        patientId: formData.patientId,
        patientName: formData.patientName,
        date: formData.date,
        time: formData.time,
        department: formData.department,
        doctor: formData.doctor,
        status: 'scheduled',
        notes: formData.notes,
        type: formData.type as Appointment['type'],
        contactNumber: formData.contactNumber,
        email: formData.email,
        createdAt: new Date()
      };
      
      // Simulate API delay
      setTimeout(() => {
        onSubmit(newAppointment);
        setIsSubmitting(false);
        onClose();
      }, 800);
    } else {
      handleNextStep();
    }
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Patient Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="patientName"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border ${errors.patientName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter patient name"
                  />
                </div>
                {errors.patientName && (
                  <p className="mt-1 text-sm text-red-600">{errors.patientName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="patientId"
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.patientId ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter patient ID"
                />
                {errors.patientId && (
                  <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border ${errors.contactNumber ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter contact number"
                  />
                </div>
                {errors.contactNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter email address (optional)"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border ${errors.department ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  >
                    {Object.entries(departmentNames).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    id="doctor"
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border ${errors.doctor ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  >
                    {doctors[formData.department as keyof typeof doctors].map(doctor => (
                      <option key={doctor} value={doctor}>{doctor}</option>
                    ))}
                  </select>
                </div>
                {errors.doctor && (
                  <p className="mt-1 text-sm text-red-600">{errors.doctor}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.type ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="new-visit">New Visit</option>
                  <option value="procedure">Procedure</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Schedule Appointment</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={format(formData.date, 'yyyy-MM-dd')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      date: new Date(e.target.value)
                    }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-full">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-800">Appointment Summary</h4>
                  <ul className="mt-2 space-y-1 text-sm text-blue-700">
                    <li>Patient: {formData.patientName}</li>
                    <li>Department: {departmentNames[formData.department]}</li>
                    <li>Doctor: {formData.doctor}</li>
                    <li>Date: {format(formData.date, 'MMMM d, yyyy')}</li>
                    <li>Time: {formData.time}</li>
                    <li>Type: {formData.type.replace('-', ' ')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">New Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((stepNumber) => (
                <React.Fragment key={stepNumber}>
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step >= stepNumber 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {stepNumber}
                    </div>
                    <span className="text-xs mt-1 text-gray-500">
                      {stepNumber === 1 ? 'Patient' : stepNumber === 2 ? 'Details' : 'Schedule'}
                    </span>
                  </div>
                  
                  {stepNumber < 3 && (
                    <div 
                      className={`w-16 h-1 mx-2 ${
                        step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {renderStepContent()}
          </div>
          
          <div className="p-6 bg-gray-50 border-t flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            <button
              type={step === 3 ? 'submit' : 'button'}
              onClick={step === 3 ? undefined : handleNextStep}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>{step === 3 ? 'Schedule Appointment' : 'Continue'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};