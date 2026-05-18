import { useState } from 'react';
import Menu from './Components/Menu'; 
import Admin from './Components/Admin'; 
import './App.css'; 

function App() {
  const [vista, setVista] = useState('menu'); 

  return (
    <div className="app-container">
      <nav style={{ padding: '10px', background: '#1a1a1a', display: 'flex', gap: '15px' }}>
        <button onClick={() => setVista('menu')} style={{ color: vista === 'menu' ? '#ff9800' : '#fff' }}>
          Ver Menú
        </button>
        <button onClick={() => setVista('admin')} style={{ color: vista === 'admin' ? '#ff9800' : '#fff' }}>
          Panel Admin
        </button>
      </nav>

      <main>
        {vista === 'menu' ? <Menu /> : <Admin />}
      </main>
    </div>
  );
}

export default App;