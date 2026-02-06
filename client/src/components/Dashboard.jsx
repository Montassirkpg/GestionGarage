import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'
import VehicleForm from './VehicleForm';
import './AdminDashboard.css';
const baseURI = import.meta.env.VITE_API_BASE_URL;

const AdminDashboard = () => {
  const [clientCount, setClientCount] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClientCount();
    fetchVehicles();
  }, []);

  const fetchClientCount = async () => {
    try {
      const response = await fetch(baseURI + 'api/clients/count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setClientCount(data.count);
      } else {
        alert('Erreur lors de la récupération du nombre de clients');
        navigate('/')
      }
    } catch (error) {
      alert('Erreur réseau');
      navigate('/')
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(baseURI + 'api/vehicles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      } else {
        alert('Erreur lors de la récupération des véhicules');
        navigate('/')
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur réseau');
      navigate('/')
    }
  };

  const handleVehicleAdded = () => {
    fetchVehicles();
    setShowForm(false);
    setEditingVehicle(null);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingVehicle(null);
    setShowForm(false);
  };

  const handleDelete = async (vehicle) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le véhicule ${vehicle.brand} ${vehicle.model} (${vehicle.license_plate}) ?\n\nCette action est irréversible.`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${baseURI}api/vehicles/${vehicle.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        alert('Véhicule supprimé avec succès !');
        fetchVehicles(); 
      } else {
        const errorText = await response.text();
        alert(errorText || 'Erreur lors de la suppression du véhicule');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur réseau lors de la suppression');
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Tableau de bord admin</h2>
      <p>Nombre de clients inscrits : {clientCount}</p>
      
      <div className="vehicles-section">
        <div className="section-header">
          <h3>Liste des véhicules</h3>
          <button 
            className="add-vehicle-btn" 
            onClick={() => {
              if (showForm && !editingVehicle) {
                setShowForm(false);
              } else {
                setEditingVehicle(null);
                setShowForm(!showForm);
              }
            }}
          >
            {showForm && !editingVehicle ? 'Annuler' : '+ Ajouter un véhicule'}
          </button>
        </div>

        {showForm && (
          <VehicleForm 
            onVehicleAdded={handleVehicleAdded} 
            editingVehicle={editingVehicle}
            onCancelEdit={handleCancelEdit}
          />
        )}
        
        {vehicles.length === 0 ? (
          <p>Aucun véhicule enregistré</p>
        ) : (
          <table className="vehicles-table">
            <thead>
              <tr>
                <th>Plaque d'immatriculation</th>
                <th>Marque</th>
                <th>Modèle</th>
                <th>Année</th>
                <th>Client</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.license_plate}</td>
                  <td>{vehicle.brand}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.year}</td>
                  <td>
                    {vehicle.client_name ? (
                      <div>
                        <div className="client-name">{vehicle.client_name}</div>
                        <div className="client-email">{vehicle.client_email}</div>
                      </div>
                    ) : (
                      <span className="no-client">Non associé</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(vehicle)}
                    >
                       Modifier
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(vehicle)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
