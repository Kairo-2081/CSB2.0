import AddStudent from './components/AddStudent';
import StudentList from './components/StudentList';

function App() {
  return (
    <div className="App">
      <h1>My Supabase App</h1>
      <AddStudent />  {/* Form to insert data */}
      <StudentList /> {/* List of students */}
    </div>
  );
}

export default App;
