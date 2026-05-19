import { useState, useEffect } from 'react';
import { db } from '../Firebase/config';
import { collection, getDocs, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import '../App.css'; 

const Menu = () => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [leche, setLeche] = useState('Entera');
  const [jarabe, setJarabe] = useState('Ninguno');
  const [sistemaAbierto, setSistemaAbierto] = useState(true);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const numeroMesa = (queryParams.get('mesa') || 'Barra').split('(')[0].trim();

  const opcionesLeche = ['Entera', 'Deslactosada', 'Almendra'];
  const opcionesJarabe = ['Ninguno', 'Menta', 'Canela', 'Avellana', 'Vainilla', 'Caramelo'];

  useEffect(() => {
    const unsubscribeEstado = onSnapshot(doc(db, "configuracion", "estado_tienda"), (docSnap) => {
      if (docSnap.exists()) {
        setSistemaAbierto(docSnap.data().abierto);
      }
    });

    const obtenerDatos = async () => {
      try {
        const datos = await getDocs(collection(db, 'productos'));
        const productosProcesados = datos.docs.map(doc => {
          const rawData = doc.data();
          
          const data = {};
          Object.keys(rawData).forEach(key => {
            data[key.trim()] = rawData[key];
          });

          const categoriaLimpia = data.categoria 
            ? String(data.categoria).replace(/\s+/g, '').toLowerCase() 
            : 'todos';

          return {
            id: doc.id,
            nombre: data.nombre || 'Producto sin nombre',
            precio: data.precio || 0,
            imagen: data.imagen || '/logo-kaizen.png', 
            categoria: categoriaLimpia
          };
        });
        setProductos(productosProcesados);
      } catch (error) { 
        console.error("Error obteniendo productos de Firestore:", error); 
      }
    };

    obtenerDatos();
    return () => unsubscribeEstado();
  }, []);

  const agregarAlCarrito = () => {
    if (!productoSeleccionado) return;
    const nombre = productoSeleccionado.nombre.toLowerCase();
    const categoria = productoSeleccionado.categoria;
    
    const esTradicional = nombre.includes('sheikiatto') || 
                          nombre.includes('afrogatto') || 
                          nombre.includes('tonic') || 
                          nombre.includes('sun rise') || 
                          nombre.includes('perrier') || 
                          nombre.includes('agua') ||
                          nombre.includes('galleta');

    const permiteLeche = !esTradicional;

    const permiteJarabe = (
      categoria === 'caliente' || 
      nombre.includes('golden moka') || 
      nombre.includes('ice matcha')
    ) && !esTradicional;

    const cargoJarabe = (permiteJarabe && jarabe !== 'Ninguno') ? 5 : 0;
    const precioFinal = Number(productoSeleccionado.precio) + cargoJarabe;

    setCarrito([...carrito, {
      ...productoSeleccionado,
      id_carrito: Date.now(),
      lecheElegida: permiteLeche ? leche : 'No aplica',
      jarabeElegido: permiteJarabe ? jarabe : 'No aplica',
      precioCalculado: precioFinal
    }]);
    setProductoSeleccionado(null);
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(p => p.id_carrito !== id));
  };

  const confirmarPedido = async () => {
    if (carrito.length === 0) return;
    try {
      const itemsParaFirebase = carrito.map(p => {
        let det = p.nombre;
        if (p.lecheElegida !== 'No aplica') det += ` (${p.lecheElegida})`;
        if (p.jarabeElegido !== 'No aplica' && p.jarabeElegido !== 'Ninguno') det += ` + Jarabe ${p.jarabeElegido}`;
        
        return {
          nombre: det,
          entregado: false
        };
      });

      await addDoc(collection(db, 'pedidos'), {
        items: itemsParaFirebase,
        total: carrito.reduce((acc, p) => acc + p.precioCalculado, 0),
        mesa: numeroMesa,
        fecha: new Date().toLocaleString(),
        estado: 'pendiente'
      });
      alert("¡Pedido enviado a barra!");
      setCarrito([]);
    } catch (e) { console.error("Error enviando pedido:", e); }
  };

  if (!sistemaAbierto) {
    return (
      <div className="background-kaizen" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: '#f4f1ed', padding: '20px' }}>
        <div className="logo-kaizen-estatico">
           <img src="/logo-kaizen.png" alt="Logo" />
        </div>
        <h1 className="titulo-vintage">CERRADO, GRACIAS POR VISITARNOS</h1>
        <p style={{ fontSize: '18px', marginTop: '20px', color: '#CBBBA0' }}>
          No aceptamos ningún pedido por el momento. <br/> 
          ¡Esperamos verte pronto para disfrutar de un delicioso café juntos!
        </p>
      </div>
    );
  }

  return (
    <div className="background-kaizen" style={{ paddingBottom: '220px', color: '#f4f1ed', fontFamily: 'serif' }}>
      <div style={{ textAlign: 'center', paddingTop: '40px', position: 'relative', zIndex: 1 }}>
        <div className="logo-kaizen-estatico">
          <img src="/logo-kaizen.png" alt="Logo" />
        </div>
        <h1 className="titulo-vintage">KAIZEN KAFE MENU</h1>
        <p className="subtitulo-mesa">MESA: {numeroMesa}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px', position: 'relative', zIndex: 1 }}>
        {['todos', 'caliente', 'frio', 'postre'].map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: '8px 20px', borderRadius: '20px', border: '1px solid #CBBBA0', backgroundColor: categoriaActiva === cat ? '#CBBBA0' : 'transparent', color: categoriaActiva === cat ? '#1c2c3c' : '#CBBBA0', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 15px', position: 'relative', zIndex: 1 }}>
        {productos
          .filter(p => categoriaActiva === 'todos' || p.categoria === categoriaActiva)
          .map(p => (
            <div key={p.id} className="tarjeta-producto">
              <img src={p.imagen} alt={p.nombre} style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover', marginRight: '15px' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>{p.nombre}</h3>
                <p style={{ color: '#CBBBA0', fontWeight: 'bold', margin: '5px 0' }}>${p.precio}</p>
              </div>
              <button onClick={() => { setLeche('Entera'); setJarabe('Ninguno'); setProductoSeleccionado(p); }} style={{ backgroundColor: '#CBBBA0', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Añadir</button>
            </div>
          ))}
      </div>

      {productoSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: '#1c2c3c', border: '2px solid #CBBBA0', borderRadius: '25px', padding: '25px', width: '90%', maxWidth: '400px' }}>
            <h2 style={{ textAlign: 'center', marginTop: 0 }}>{productoSeleccionado.nombre}</h2>
            

            {!(productoSeleccionado.nombre.toLowerCase().includes('sheikiatto') || 
               productoSeleccionado.nombre.toLowerCase().includes('afrogatto') || 
               productoSeleccionado.nombre.toLowerCase().includes('tonic') || 
               productoSeleccionado.nombre.toLowerCase().includes('sun rise') || 
               productoSeleccionado.nombre.toLowerCase().includes('perrier') || 
               productoSeleccionado.nombre.toLowerCase().includes('agua') ||
               productoSeleccionado.nombre.toLowerCase().includes('galleta')) ? (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', color: '#CBBBA0' }}>TIPO DE LECHE</label>
                <select value={leche} onChange={(e) => setLeche(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#1a1a1a', color: 'white', border: '1px solid #CBBBA0', marginTop: '5px' }}>
                  {opcionesLeche.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ) : <p style={{ textAlign: 'center', color: '#CBBBA0', margin: '20px 0', fontSize: '14px' }}>Producto de receta fija sin lácteos.</p>}

            {(productoSeleccionado.categoria === 'caliente' || 
              productoSeleccionado.nombre.toLowerCase().includes('golden moka') ||
              productoSeleccionado.nombre.toLowerCase().includes('ice matcha')) && 
             !(productoSeleccionado.nombre.toLowerCase().includes('sheikiatto') || 
               productoSeleccionado.nombre.toLowerCase().includes('afrogatto') || 
               productoSeleccionado.nombre.toLowerCase().includes('tonic') ||
               productoSeleccionado.nombre.toLowerCase().includes('galleta')) ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#CBBBA0' }}>JARABE ADICIONAL (+$5)</label>
                <select value={jarabe} onChange={(e) => setJarabe(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#1a1a1a', color: 'white', border: '1px solid #CBBBA0', marginTop: '5px' }}>
                  {opcionesJarabe.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ) : <p style={{ textAlign: 'center', color: '#CBBBA0', fontStyle: 'italic', marginBottom: '20px', fontSize: '14px' }}>Este producto no admite jarabes adicionales.</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setProductoSeleccionado(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #ff4d4d', color: '#ff4d4d', background: 'none', cursor: 'pointer' }}>CANCELAR</button>
              <button onClick={agregarAlCarrito} style={{ flex: 2, padding: '12px', borderRadius: '12px', backgroundColor: '#CBBBA0', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}

      {carrito.length > 0 && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '420px', backgroundColor: '#2c1e1a', padding: '20px', borderRadius: '25px', boxShadow: '0 -10px 30px rgba(0,0,0,0.7)', border: '1px solid #4a342e', zIndex: 1000 }}>
          <div style={{ maxHeight: '100px', overflowY: 'auto', marginBottom: '10px' }}>
            {carrito.map(item => (
              <div key={item.id_carrito} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                <span style={{ maxWidth: '75%' }}>{item.nombre}</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span>${item.precioCalculado}</span>
                  <button onClick={() => eliminarDelCarrito(item.id_carrito)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={confirmarPedido} className="boton-confirmar-vintage">
            CONFIRMAR PEDIDO: ${carrito.reduce((acc, p) => acc + p.precioCalculado, 0)}
          </button>
        </div>
      )}

      <div style={{ width: '100%', textAlign: 'center', padding: '20px 0', marginTop: '40px', borderTop: '1px solid rgba(203, 187, 160, 0.15)', backgroundColor: 'rgba(28, 44, 60, 0.2)' }}>
        <a href="https://www.instagram.com/kaizen_kafe/?hl=es" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#CBBBA0', textDecoration: 'none', fontSize: '14px', fontWeight: '500', letterSpacing: '1px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          SÍGUENOS EN INSTAGRAM: @kaizen_kafe
        </a>
      </div>
    </div>
  );
};

export default Menu;