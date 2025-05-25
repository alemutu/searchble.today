import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Search, Filter, FlaskRound as Flask, CheckCircle, XCircle, AlertTriangle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LabResult {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  test_type: string;
  test_date: string;
  status: string;
  results: any;
  reviewed_by: {
    first_name: string;
    last_name: string;
  } | null;
}

const Laboratory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    fetchLabResults();
  }, [hospital]);

  const fetchLabResults = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_results')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name),
          reviewed_by:reviewed_by(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLabResults(data || []);
    } catch (error) {
      console.error('Error fetching lab results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'cancelled':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredResults = labResults.filter(result => {
    const patientName = `${result.patient.first_name} ${result.patient.last_name}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         result.test_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || result.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Laboratory</h1>
        <Link to="/laboratory/new-test" className="btn btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          New Test Request
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Tests</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {labResults.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-warning-100">
              <Flask className="h-6 w-6 text-warning-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {labResults.filter(r => 
                  r.status === 'completed' && 
                  new Date(r.test_date).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-success-100">
              <CheckCircle className="h-6 w-6 text-success-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Urgent Results</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {labResults.filter(r => r.status === 'pending' && r.results?.urgent).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-error-100">
              <AlertTriangle className="h-6 w-6 text-error-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
              placeholder="Search by patient name or test type..."
            />
          </div>
          
          <div className="relative sm:w-1/4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input pl-10"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviewed By
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No lab results found
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => (
                  <tr key={result.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {result.results?.urgent && (
                          <AlertTriangle className="h-5 w-5 text-error-500 mr-2" />
                        )}
                        <div>
                          <Link to={`/patients/${result.patient.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                            {result.patient.first_name} {result.patient.last_name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{result.test_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(result.test_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(result.status)}`}>
                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.reviewed_by ? (
                          `Dr. ${result.reviewed_by.first_name} ${result.reviewed_by.last_name}`
                        ) : (
                          <span className="text-gray-500">Not reviewed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/laboratory/${result.id}`} className="text-primary-600 hover:text-primary-900">
                        View Results
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Laboratory;