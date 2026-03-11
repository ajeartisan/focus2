import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import { formatUSD, generateId } from '../../lib/utils.js';

export default function BigBills() {
  const bills = useAppStore(s => s.bills);
  const mutateBills = useAppStore(s => s.mutateBills);
  const removeBill = useAppStore(s => s.removeBill);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', amount: '', dueDate: '', category: '' });

  // Sort: unpaid by due date first, then paid
  const sorted = [...bills].sort((a, b) => {
    if (a.paid !== b.paid) return a.paid ? 1 : -1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return 0;
  });

  const unpaidTotal = bills.filter(b => !b.paid).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const bill = {
      id: editId || generateId(),
      name: form.name,
      amount: parseFloat(form.amount) || 0,
      dueDate: form.dueDate || null,
      category: form.category,
      paid: false,
    };
    mutateBills(prev => {
      if (editId) {
        const updated = prev.map(b => b.id === editId ? { ...b, ...bill } : b);
        return { updated, changed: [bill] };
      }
      return { updated: [...prev, bill], changed: [bill] };
    });
    setForm({ name: '', amount: '', dueDate: '', category: '' });
    setShowForm(false);
    setEditId(null);
  };

  const handleEdit = (bill) => {
    setForm({ name: bill.name, amount: String(bill.amount || ''), dueDate: bill.dueDate || '', category: bill.category || '' });
    setEditId(bill.id);
    setShowForm(true);
  };

  const handlePaid = (billId) => {
    mutateBills(prev => {
      const updated = prev.map(b =>
        b.id === billId ? { ...b, paid: !b.paid, paidDate: !b.paid ? new Date().toISOString() : null } : b
      );
      const changed = updated.filter(b => b.id === billId);
      return { updated, changed };
    });
  };

  const handleDelete = (billId) => {
    removeBill(billId);
  };

  return (
    <div className="column-card">
      <div className="column-header">
        <h3 className="column-title">Bills</h3>
        <button className="add-btn" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', amount: '', dueDate: '', category: '' }); }}>+</button>
      </div>

      {showForm && (
        <form className="bill-form" onSubmit={handleSubmit}>
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <div className="form-actions">
            <button type="submit">{editId ? 'Update' : 'Add'}</button>
            <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {sorted.length === 0 && !showForm ? (
        <p className="empty-state">No bills</p>
      ) : (
        sorted.map(bill => (
          <div key={bill.id} className={`bill-item ${bill.paid ? 'bill-paid' : ''}`}>
            <div className="bill-info">
              <span className="bill-name">{bill.name}</span>
              <span className="bill-amount">{formatUSD(bill.amount)}</span>
            </div>
            <div className="bill-meta">
              {bill.dueDate && <span className="bill-due">{bill.dueDate}</span>}
              <button className="bill-action" onClick={() => handlePaid(bill.id)}>{bill.paid ? 'Unpay' : 'Paid'}</button>
              <button className="bill-action" onClick={() => handleEdit(bill)}>Edit</button>
              <button className="bill-action danger" onClick={() => handleDelete(bill.id)}>Del</button>
            </div>
          </div>
        ))
      )}

      <div className="bill-total">
        <span>Unpaid Total</span>
        <span>{formatUSD(unpaidTotal)}</span>
      </div>
    </div>
  );
}
