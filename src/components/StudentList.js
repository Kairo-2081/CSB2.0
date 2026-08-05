import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function StudentList() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase.from('students').select('*');
      if (error) console.log('Error:', error);
      else setStudents(data);
    };
    fetchStudents();
  }, []);

  return (
    <div>
      <h2>Students:</h2>
      <ul>
        {students.map((s) => (
          <li key={s.id}>{s.name} - {s.email}</li>
        ))}
      </ul>
    </div>
  );
}

export default StudentList;
