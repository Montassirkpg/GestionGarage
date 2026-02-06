import { useState, useEffect } from 'react';
import './VehicleForm.css';
const baseURI = import.meta.env.VITE_API_BASE_URL;

const VehicleForm = ({ onVehicleAdded, editingVehicle, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    license_plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    client_id: ''
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingVehicle) {
      setFormData({
        license_plate: editingVehicle.license_plate,
        brand: editingVehicle.brand,
        model: editingVehicle.model,
        year: editingVehicle.year,
        client_id: editingVehicle.client_id || ''
      });
    }
  }, [editingVehicle]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(baseURI + 'api/clients', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des clients:', error);
      }
    };

    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = editingVehicle 
        ? `${baseURI}api/vehicles/${editingVehicle.id}`
        : `${baseURI}api/vehicles`;
      
      const method = editingVehicle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({
          license_plate: '',
          brand: '',
          model: '',
          year: new Date().getFullYear(),
          client_id: ''
        });
        if (onVehicleAdded) {
          onVehicleAdded();
        }
        alert(editingVehicle ? 'Véhicule modifié avec succès !' : 'Véhicule ajouté avec succès !');
      } else {
        const errorText = await response.text();
        setError(errorText || `Erreur lors de ${editingVehicle ? 'la modification' : 'l\'ajout'} du véhicule`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vehicle-form-container">
      <h3>{editingVehicle ? 'Modifier le véhicule' : 'Ajouter un nouveau véhicule'}</h3>
      <form onSubmit={handleSubmit} className="vehicle-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="license_plate">Plaque d'immatriculation *</label>
            <input
              type="text"
              id="license_plate"
              name="license_plate"
              value={formData.license_plate}
              onChange={handleChange}
              placeholder="AB-123-CD"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="brand">Marque *</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Renault, Peugeot..."
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="model">Modèle *</label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="Clio, 208..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="year">Année *</label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear() + 1}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="client_id">Client (optionnel)</label>
          <select
            id="client_id"
            name="client_id"
            value={formData.client_id}
            onChange={handleChange}
          >
            <option value="">-- Non associé --</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.firstname} {client.lastname} ({client.email})
              </option>
            ))}
          </select>
        </div>

        <div className="form-buttons">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading 
              ? (editingVehicle ? 'Modification en cours...' : 'Ajout en cours...') 
              : (editingVehicle ? 'Modifier le véhicule' : 'Ajouter le véhicule')
            }
          </button>
          {editingVehicle && onCancelEdit && (
            <button type="button" className="cancel-btn" onClick={onCancelEdit}>
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
