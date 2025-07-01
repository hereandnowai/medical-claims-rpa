
import React, { useState, useCallback } from 'react';
import { AnalyzedClaim, Claim } from '../types';
import { analyzeClaimWithAI } from '../services/geminiService';
import { CheckCircleIcon, ClockIcon, CloudArrowUpIcon, ExclamationTriangleIcon, SparklesIcon } from './icons/Icons';

interface ClaimsProcessorProps {
  onProcessComplete: (claims: AnalyzedClaim[]) => void;
}

const ClaimsProcessor: React.FC<ClaimsProcessorProps> = ({ onProcessComplete }) => {
  const [claims, setClaims] = useState<AnalyzedClaim[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      setError('Invalid file type. Please upload a CSV file.');
      return;
    }

    setFileName(file.name);
    setError('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) {
        setError('CSV file is empty or contains only a header.');
        return;
    }
    const header = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['claim_id', 'patient_id', 'provider_name', 'date_of_service', 'diagnosis_code', 'procedure_code', 'claim_amount', 'insurance_policy_number', 'status', 'submitted_date', 'approval_date'];

    if(JSON.stringify(header) !== JSON.stringify(expectedHeaders)){
        setError(`CSV header does not match expected format. Expected: ${expectedHeaders.join(', ')}`);
        return;
    }

    const parsedClaims: AnalyzedClaim[] = lines.slice(1).map((line, index) => {
      const data = line.split(',');
      const claim: Claim = {
        claim_id: data[0]?.trim() || '',
        patient_id: data[1]?.trim() || '',
        provider_name: data[2]?.trim() || '',
        date_of_service: data[3]?.trim() || '',
        diagnosis_code: data[4]?.trim() || '',
        procedure_code: data[5]?.trim() || '',
        claim_amount: data[6]?.trim() || '',
        insurance_policy_number: data[7]?.trim() || '',
        status: data[8]?.trim() || 'Submitted',
        submitted_date: data[9]?.trim() || '',
        approval_date: data[10]?.trim() || '',
      };
      return { ...claim, id: index, aiAnalysis: null, processingState: 'pending' };
    });

    setClaims(parsedClaims);
  };
  
  const processClaims = useCallback(async () => {
    if (claims.length === 0 || !process.env.API_KEY) {
        setError("No claims to process or API key is missing.");
        return
    };

    setIsProcessing(true);
    
    const processedClaims: AnalyzedClaim[] = [...claims];

    for (let i = 0; i < processedClaims.length; i++) {
        const claim = processedClaims[i];
        
        setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, processingState: 'processing' } : c));
        
        try {
            const analysis = await analyzeClaimWithAI(claim);
            processedClaims[i] = { ...claim, aiAnalysis: analysis, processingState: 'done' };
        } catch (e) {
            console.error(e);
            processedClaims[i] = { ...claim, processingState: 'error', aiAnalysis: { validationErrors: ['AI Processing Failed'], riskLevel: 'High', suggestedWorkflow: 'Manual Review'} };
        } finally {
            setClaims([...processedClaims]); // Update state after each analysis to show progress
        }
    }

    setIsProcessing(false);
    onProcessComplete(processedClaims);
  }, [claims, onProcessComplete]);

  const getStatusIcon = (status: AnalyzedClaim['processingState']) => {
    switch(status) {
        case 'pending': return <ClockIcon className="text-yellow-400" />;
        case 'processing': return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>;
        case 'done': return <CheckCircleIcon className="text-green-400" />;
        case 'error': return <ExclamationTriangleIcon className="text-red-400" />;
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-secondary-light p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-primary mb-4">Process Medical Claims</h2>
        <p className="text-gray-400 mb-6">Upload a CSV file with claims data to begin the automated analysis and validation process.</p>
        
        <div className="flex items-center justify-center w-full mb-6">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-secondary-dark border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-secondary-dark/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <CloudArrowUpIcon className="w-10 h-10 mb-4 text-gray-400"/>
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">CSV files only</p>
                    {fileName && <p className="text-sm mt-4 text-green-400">{fileName}</p>}
                </div>
                <input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
            </label>
        </div>

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
        
        <div className="flex justify-center">
            <button 
                onClick={processClaims}
                disabled={claims.length === 0 || isProcessing || !process.env.API_KEY}
                className="flex items-center gap-2 bg-primary text-secondary-dark font-bold py-3 px-8 rounded-lg shadow-md hover:bg-yellow-300 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
            >
                <SparklesIcon />
                {isProcessing ? 'Processing...' : `Process ${claims.length} Claims`}
            </button>
        </div>
        {!process.env.API_KEY && <p className="text-yellow-400 text-center mt-4 text-sm">Warning: API_KEY is not configured. AI processing is disabled.</p>}
      </div>

      {claims.length > 0 && (
         <div className="mt-8 bg-secondary-light p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-primary mb-4">Uploaded Claims</h3>
             <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-primary uppercase bg-secondary-dark sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Claim ID</th>
                            <th scope="col" className="px-6 py-3">Provider</th>
                            <th scope="col" className="px-6 py-3">Amount</th>
                            <th scope="col" className="px-6 py-3">AI Analysis</th>
                        </tr>
                    </thead>
                    <tbody>
                        {claims.map(claim => (
                            <tr key={claim.id} className="border-b border-secondary-dark hover:bg-secondary">
                                <td className="px-6 py-4">{getStatusIcon(claim.processingState)}</td>
                                <td className="px-6 py-4 font-medium text-white">{claim.claim_id}</td>
                                <td className="px-6 py-4">{claim.provider_name}</td>
                                <td className="px-6 py-4">{claim.claim_amount}</td>
                                <td className="px-6 py-4">{claim.aiAnalysis ? `${claim.aiAnalysis.riskLevel} Risk - ${claim.aiAnalysis.suggestedWorkflow}` : 'Pending'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
         </div>
      )}
    </div>
  );
};

export default ClaimsProcessor;
