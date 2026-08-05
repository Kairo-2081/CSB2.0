import { useState } from 'react';
import { supabase } from '../supabaseClient';

function AddStudent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleAddStudent = async () => {
    const { data, error } = await supabase
      .from('students')
      .insert([{ name: name, email: email }]);
    
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Inserted:', data);
      setName('');
      setEmail('');
    }
  };

  return (
    <div>
      <h2>Add Student</h2>
      <input 
        type="text" 
        placeholder="Name" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
      />
      <input 
        type="email" 
        placeholder="Email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <button onClick={handleAddStudent}>Add Student</button>
    </div>
  );
}

export default AddStudent;
