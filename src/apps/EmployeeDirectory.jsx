import { useEffect, useState } from 'react';
import { FiAlertCircle, FiUsers } from 'react-icons/fi';
import { supabase, supabaseConfigured } from '../services/supabaseClient.js';

const roleLabels = {
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff / Refiller',
  delivery: 'Delivery',
};

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      if (!supabaseConfigured) {
        setError('Supabase is not configured for this deployment.');
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('employees')
        .select('id, full_name, primary_role, active')
        .order('full_name');

      if (cancelled) return;
      if (queryError) setError('Could not load employee accounts. Check the Supabase migration and owner access policy.');
      else setEmployees(data ?? []);
      setLoading(false);
    }

    loadEmployees().catch(() => {
      if (!cancelled) {
        setError('Could not connect to employee accounts. Please try again later.');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  return <>
    <div className="mgmt-heading">
      <div className="overline">Team directory</div>
      <h1>Employee Accounts</h1>
      <p>Staff identities and roles are read from the Supabase employee records.</p>
    </div>
    <div className="mgmt-card">
      {loading && <p className="mgmt-sub" role="status">Loading employee accounts…</p>}
      {error && <p className="mgmt-notice" role="alert">{error}</p>}
      {!loading && !error && employees.length === 0 && (
        <div className="owner-empty">
          <FiUsers size={22}/>
          <strong>No employee accounts are linked yet</strong>
          <p>Create users in Supabase Auth, then link each user to a role in <code>public.employees</code>.</p>
        </div>
      )}
      {!loading && !error && employees.map((employee) => (
        <div className="mgmt-row" key={employee.id}>
          <div>
            <strong className="mgmt-row-title">{employee.full_name}</strong>
            <p className="mgmt-sub">{roleLabels[employee.primary_role] ?? employee.primary_role}</p>
          </div>
          <span className={'owner-state ' + (employee.active ? 'active' : '')}>
            {employee.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      ))}
    </div>
    <div className="mgmt-notice"><FiAlertCircle/> Account creation and role changes are restricted to an authorized Supabase administrator.</div>
  </>;
}
