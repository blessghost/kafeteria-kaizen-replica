import { useState, useEffect } from 'react';
import { db } from '../Firebase/config';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,  
  getDocs,
  writeBatch 
} from 'firebase/firestore';
import '../App.css'; 

const Admin = () => {
  const [pedidos, setPedidos] = useState([]);
  const [sistemaAbierto, setSistemaAbierto] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), orderBy('fecha', 'desc'));
    const unsubscribePedidos = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPedidos(docs);
    });

    const unsubscribeEstado = onSnapshot(doc(db, "configuracion", "estado_tienda"), (docSnap) => {
      if (docSnap.exists()) {
        setSistemaAbierto(docSnap.data().abierto);
      }
    });

    return () => {
      unsubscribePedidos();
      unsubscribeEstado();
    };
  }, []);

  const limpiarPedidosBaseDatos = async () => {
    const q = query(collection(db, 'pedidos'));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  };

  const toggleSistema = async () => {
    try {
      const nuevoEstado = !sistemaAbierto;
      if (nuevoEstado === true) {
        const confirmar = window.confirm("¿Deseas abrir el turno y limpiar los pedidos del día anterior?");
        if (confirmar) {
          await limpiarPedidosBaseDatos();
        }
      }

      await updateDoc(doc(db, "configuracion", "estado_tienda"), {
        abierto: nuevoEstado
      });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const marcarEntregado = async (pedidoId, indexItem, estadoActual) => {
    try {
      const pedidoRef = doc(db, 'pedidos', pedidoId);
      const pedido = pedidos.find(p => p.id === pedidoId);
      const nuevosItems = [...pedido.items];
      if (typeof nuevosItems[indexItem] === 'string') {
        nuevosItems[indexItem] = {
          nombre: nuevosItems[indexItem],
          entregado: true
        };
      } else {
        nuevosItems[indexItem].entregado = !estadoActual;
      }

      await updateDoc(pedidoRef, {
        items: nuevosItems
      });
    } catch (error) {
      console.error("Error al actualizar item:", error);
    }
  };

  return (
    <div className="background-kaizen" style={{ minHeight: '100vh', padding: '20px', color: '#f4f1ed' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 className="titulo-vintage">PANEL DE CONTROL KAIZEN</h1>
        
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '15px', 
          backgroundColor: 'rgba(0,0,0,0.6)', 
          padding: '10px 25px', 
          borderRadius: '50px',
          border: `2px solid ${sistemaAbierto ? '#4CAF50' : '#ff4d4d'}`
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {sistemaAbierto ? "🟢 SISTEMA ACTIVO" : "🔴 SISTEMA CERRADO"}
          </span>
          <button 
            onClick={toggleSistema}
            style={{ 
              padding: '8px 18px', 
              borderRadius: '20px', 
              border: 'none', 
              backgroundColor: sistemaAbierto ? '#ff4d4d' : '#4CAF50', 
              color: 'white', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              transition: '0.3s'
            }}
          >
            {sistemaAbierto ? "CERRAR TURNO" : "ABRIR TURNO"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {pedidos.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '50px', opacity: 0.6 }}>
             <p>Esperando el primer pedido del día...</p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <div key={pedido.id} className="tarjeta-producto" style={{ display: 'block', marginBottom: '20px', padding: '20px', borderLeft: '5px solid #CBBBA0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>MESA: {pedido.mesa}</span>
                <span style={{ fontSize: '12px', opacity: 0.7 }}>{pedido.fecha}</span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                {pedido.items.map((item, index) => {
                  const esObjeto = typeof item === 'object';
                  const nombreItem = esObjeto ? item.nombre : item;
                  const entregado = esObjeto ? item.entregado : false;

                  return (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)' 
                    }}>
                      <span style={{ 
                        color: entregado ? '#4CAF50' : '#f4f1ed',
                        textDecoration: entregado ? 'line-through' : 'none',
                        transition: '0.3s',
                        fontSize: '16px'
                      }}>
                        • {nombreItem}
                      </span>
                      <button 
                        onClick={() => marcarEntregado(pedido.id, index, entregado)}
                        style={{
                          backgroundColor: entregado ? '#4CAF50' : 'transparent',
                          border: '1px solid #4CAF50',
                          color: entregado ? 'white' : '#4CAF50',
                          borderRadius: '5px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      >
                        {entregado ? '✓ ENTREGADO' : 'MARCAR ENTREGA'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: 'right', borderTop: '1px solid rgba(203, 187, 160, 0.3)', paddingTop: '10px' }}>
                <span style={{ color: '#CBBBA0', fontSize: '14px' }}>Total del pedido:</span>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#CBBBA0' }}>${pedido.total}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Admin;