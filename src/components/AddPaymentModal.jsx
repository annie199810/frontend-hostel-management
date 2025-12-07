import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function AddPaymentModal({ resident, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [roomNo, setRoomNo] = useState(resident?.roomNo || '');
  const [loading, setLoading] = useState(false);

  async function handleGenerateInvoice(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: resident._id,
          residentName: resident.name,
          roomNo,
          amount: Number(amount),
          dueDate: null
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed');
      onSaved && onSaved(data.invoice);
      alert('Invoice created: ' + data.invoice.invoiceNo);
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal">
      <form onSubmit={handleGenerateInvoice}>
        <h3>Add Payment / Generate Invoice</h3>
        <div>
          <label>Resident</label>
          <div>{resident?.name}</div>
        </div>
        <div>
          <label>Room</label>
          <input value={roomNo} onChange={e => setRoomNo(e.target.value)} />
        </div>
        <div>
          <label>Amount</label>
          <input value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div>
          <button type="submit" disabled={loading}>Generate Invoice</button>
          <button type="button" onClick={onClose}>Close</button>
        </div>
      </form>
    </div>
  );
}
