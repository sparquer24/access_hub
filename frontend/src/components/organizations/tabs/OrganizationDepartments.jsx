import React, { useState, useEffect } from 'react';
import { Form, Switch } from 'antd';
import CreateDepartmentModal from '../modals/CreateDepartmentModal';
import { Edit, Trash2 } from 'lucide-react';
import { departmentsService } from '../../../services/organizationsService';
import Loader from '../../common/Loader';
import { useToast } from '../../../contexts/ToastContext';

const OrganizationDepartments = ({ organizationId, organization }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, [organizationId]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const resp = await departmentsService.list({ organization_id: organizationId, per_page: 200 });
      setDepartments(resp.data?.items || resp.data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      showError(err.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    form.setFieldsValue({
      name: dept.name,
      code: dept.code,
      description: dept.description,
      is_active: dept.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete department "${dept.name}"?`)) return;
    try {
      await departmentsService.delete(dept.id, false);
      success('Successfully deleted');
      fetchDepartments();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        const payload = {
          name: values.name,
          code: values.code, // Ensure code is sent for update
          description: values.description,
          is_active: values.is_active,
        };
        await departmentsService.update(editing.id, payload);
        success('Successfully updated');
      } else {
        const payload = {
          organization_id: organizationId,
          name: values.name,
          code: values.code || values.name.toUpperCase().replace(/\s+/g, '_').substring(0, 50),
          description: values.description,
        };
        await departmentsService.create(payload);
        success('Successfully created');
      }
      setShowModal(false);
      form.resetFields();
      fetchDepartments();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || 'Failed to save department');
    }
  };

  const toggleStatus = async (dept) => {
    try {
      await departmentsService.update(dept.id, { is_active: !dept.is_active });
      success(dept.is_active ? 'Successfully disabled' : 'Successfully enabled');
      fetchDepartments();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-310px)] pb-16">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Departments</h2>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-teal-600 text-white rounded-lg">➕ Create Department</button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader />
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 bg-teal-50 rounded-xl">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-xl font-bold">No departments</h3>
          <p className="text-gray-600">Create a department to get started</p>
        </div>
      ) : (
        <div className="bg-teal-50/95 rounded-xl shadow-md max-h-[60vh] overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[55vh]">
            <table className="w-full">
            <thead className="bg-teal-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">S.No</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Code</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {departments.map((d, index) => (
                <tr key={d.id} className="hover:bg-teal-50">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4">{d.name}</td>
                  <td className="px-6 py-4">{d.code || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleStatus(d)} className={`px-3 py-1 rounded-full text-sm ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {d.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEdit(d)} title="Edit" className="w-8 h-8 inline-flex items-center justify-center bg-teal-50 text-teal-600 rounded hover:bg-teal-100 transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(d)} title="Delete" className="w-8 h-8 inline-flex items-center justify-center bg-red-50 text-red-600 rounded hover:bg-red-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <CreateDepartmentModal
        open={showModal}
        onCancel={() => { setShowModal(false); form.resetFields(); }}
        onFinish={handleSubmit}
        form={form}
        editing={editing}
      />
    </div>
  );
};

export default OrganizationDepartments;
