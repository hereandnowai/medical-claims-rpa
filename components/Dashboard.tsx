
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AnalyzedClaim, ClaimStatus } from '../types';
import { AlertIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from './icons/Icons';

interface DashboardProps {
  claims: AnalyzedClaim[];
}

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-secondary-light p-6 rounded-xl shadow-lg flex items-center justify-between transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1">
    <div>
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
    <div className={`text-4xl ${color}`}>
      {icon}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ claims }) => {

  const stats = useMemo(() => {
    const statusCounts = claims.reduce((acc, claim) => {
        const status = claim.status as ClaimStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<ClaimStatus, number>);

    return {
      total: claims.length,
      approved: statusCounts['Approved'] || 0,
      rejected: statusCounts['Rejected'] || 0,
      pending: (statusCounts['Under Review'] || 0) + (statusCounts['Submitted'] || 0),
    };
  }, [claims]);

  const chartData = useMemo(() => {
    const statusDistribution = [
      { name: 'Approved', value: stats.approved },
      { name: 'Rejected', value: stats.rejected },
      { name: 'Pending', value: stats.pending },
    ].filter(item => item.value > 0);

    const providerDistribution = claims.reduce((acc, claim) => {
        acc[claim.provider_name] = (acc[claim.provider_name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topProviders = Object.entries(providerDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const approvalsOverTime = claims
      .filter(c => c.status === 'Approved' && c.approval_date)
      .reduce((acc, claim) => {
        const date = new Date(claim.approval_date).toLocaleDateString('en-CA');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
    const sortedApprovals = Object.entries(approvalsOverTime)
        .map(([date, count]) => ({ date, count }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return { statusDistribution, topProviders, sortedApprovals };
  }, [claims, stats]);

  const alerts = useMemo(() => {
    return claims.filter(c => 
        c.aiAnalysis?.riskLevel === 'High' || 
        c.aiAnalysis?.validationErrors?.length > 0
    ).slice(0, 10);
  }, [claims]);
  
  if (claims.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">Welcome to the Dashboard</h2>
        <p className="text-gray-400">Process some claims to see your analytics here.</p>
      </div>
    );
  }

  const PIE_COLORS = ['#34D399', '#F87171', '#FBBF24'];

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Total Claims" value={stats.total} icon={<AlertIcon />} color="text-blue-400" />
        <SummaryCard title="Approved" value={stats.approved} icon={<CheckCircleIcon />} color="text-green-400" />
        <SummaryCard title="Rejected" value={stats.rejected} icon={<XCircleIcon />} color="text-red-400" />
        <SummaryCard title="Pending" value={stats.pending} icon={<ClockIcon />} color="text-yellow-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-secondary-light p-6 rounded-xl shadow-lg">
           <h3 className="text-lg font-semibold text-primary mb-4">Claim Approvals Over Time</h3>
           <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.sortedApprovals} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#004040" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#002B2B', border: '1px solid #FFDF00' }} labelStyle={{color: '#FFDF00'}} itemStyle={{color: '#E5E7EB'}}/>
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Approvals" stroke="#FFDF00" strokeWidth={2} dot={{r: 4}} activeDot={{r: 8}} />
              </LineChart>
           </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-secondary-light p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-primary mb-4">Claim Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData.statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {chartData.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#002B2B', border: '1px solid #FFDF00' }} itemStyle={{color: '#E5E7EB'}}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
         <div className="bg-secondary-light p-6 rounded-xl shadow-lg">
           <h3 className="text-lg font-semibold text-primary mb-4">Top 5 Claim Providers</h3>
           <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.topProviders} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#004040" />
                  <XAxis type="number" stroke="#9CA3AF"/>
                  <YAxis type="category" dataKey="0" stroke="#9CA3AF" width={100} tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{ backgroundColor: '#002B2B', border: '1px solid #FFDF00' }} labelStyle={{color: '#FFDF00'}} itemStyle={{color: '#E5E7EB'}} cursor={{fill: 'rgba(255, 223, 0, 0.1)'}}/>
                  <Legend />
                  <Bar dataKey="1" name="Number of Claims" fill="#FFDF00" />
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-secondary-light p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-primary mb-4">Claims Requiring Attention</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-primary uppercase bg-secondary-dark">
              <tr>
                <th scope="col" className="px-6 py-3">Claim ID</th>
                <th scope="col" className="px-6 py-3">Patient ID</th>
                <th scope="col" className="px-6 py-3">Risk Level</th>
                <th scope="col" className="px-6 py-3">Issues</th>
                <th scope="col" className="px-6 py-3">Suggested Workflow</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length > 0 ? alerts.map(claim => (
                <tr key={claim.id} className="border-b border-secondary-dark hover:bg-secondary">
                  <td className="px-6 py-4 font-medium text-white">{claim.claim_id}</td>
                  <td className="px-6 py-4">{claim.patient_id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        claim.aiAnalysis?.riskLevel === 'High' ? 'bg-red-500/20 text-red-300' : 
                        claim.aiAnalysis?.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`
                    }>{claim.aiAnalysis?.riskLevel}</span>
                  </td>
                  <td className="px-6 py-4 text-red-400">{claim.aiAnalysis?.validationErrors.join(', ') || 'High Risk'}</td>
                  <td className="px-6 py-4">{claim.aiAnalysis?.suggestedWorkflow}</td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">No high-risk claims or validation errors found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
