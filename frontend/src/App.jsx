import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import NewProcurement from './pages/NewProcurement';
import ProcurementAnalysis from './pages/ProcurementAnalysis';
import SupplierManagement from './pages/SupplierManagement';
import ApprovalCenter from './pages/ApprovalCenter';
import DocumentIntelligence from './pages/DocumentIntelligence';
import AuditTrail from './pages/AuditTrail';
import EvaluationDashboard from './pages/EvaluationDashboard';
import SystemDiagnostics from './pages/SystemDiagnostics';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-[#F7F8FA] text-gray-900 antialiased font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/new-procurement" element={<NewProcurement />} />
              <Route path="/analysis" element={<ProcurementAnalysis />} />
              <Route path="/suppliers" element={<SupplierManagement />} />
              <Route path="/approvals" element={<ApprovalCenter />} />
              <Route path="/documents" element={<DocumentIntelligence />} />
              <Route path="/audit" element={<AuditTrail />} />
              <Route path="/evaluation" element={<EvaluationDashboard />} />
              <Route path="/system" element={<SystemDiagnostics />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
