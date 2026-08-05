import { supabase } from '@/supabaseClient';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function DatabaseTest() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (msg: string) => {
    setResults((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const testConnection = async () => {
    setLoading(true);
    setResults([]);
    addResult('Testing Supabase connection...');

    try {
      // Test 1: Check if we can list tables
      addResult('Test 1: Listing tables...');
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (tablesError) {
        addResult('❌ Error listing tables: ' + tablesError.message);
      } else {
        addResult('✅ Tables found: ' + tables?.map((t: any) => t.table_name).join(', '));
      }

      // Test 2: Try to insert a test record
      addResult('Test 2: Attempting to insert test complaint...');
      const { data, error } = await supabase
        .from('complaints')
        .insert([{
          title: 'Test Complaint',
          description: 'This is a test',
          category: 'hall',
          posted_by: 'Test User',
          user_id: 'test-user-123',
        }])
        .select();

      if (error) {
        addResult('❌ Insert failed: ' + error.message);
        addResult('Error code: ' + error.code);
        addResult('Error details: ' + JSON.stringify(error));
      } else {
        addResult('✅ Insert successful!');
        addResult('Data: ' + JSON.stringify(data));
      }
    } catch (err: any) {
      addResult('❌ Exception: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
        
        <Button 
          onClick={testConnection} 
          disabled={loading}
          className="mb-6"
        >
          {loading ? 'Testing...' : 'Run Tests'}
        </Button>

        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p>Click "Run Tests" to diagnose the database connection...</p>
          ) : (
            results.map((result, i) => (
              <div key={i}>{result}</div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="font-bold mb-2">Expected Results:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>✅ Should show list of tables including: complaints, notices, marketplace, etc.</li>
            <li>✅ Should successfully insert a test complaint</li>
            <li>❌ If tables don't exist, you'll see "42P01" error (relation does not exist)</li>
            <li>❌ If RLS is blocking, you'll see "new row violates row-level security policy"</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
