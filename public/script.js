document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('main section');
  const buttons = document.querySelectorAll('nav button');
  const findCarForm = document.getElementById('findCarForm');
  const foundCarDetails = document.getElementById('foundCarDetails');
  const carForm = document.getElementById('carForm');
  const deleteCarForm = document.getElementById('deleteCarForm');
  const carList = document.getElementById('carList');

  const showMessage = (message, type = 'info') => {
    foundCarDetails.textContent = message;
    foundCarDetails.style.display = 'block';
    foundCarDetails.style.color = type === 'error' ? '#ff4d4d' : 'white';
  };

  
  const showSection = (sectionId) => {
    sections.forEach((section) => {
      section.classList.toggle('active', section.id === sectionId);
    });
    buttons.forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-section') === sectionId);
    });
    foundCarDetails.style.display = 'none'; 
  };

  
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const sectionId = button.getAttribute('data-section');
      showSection(sectionId);
      localStorage.setItem('activeSection', sectionId); 
    });
  });

  
  const activeSection = localStorage.getItem('activeSection') || 'addCar';
  showSection(activeSection);

  
  const fetchCars = async () => {
    try {
      const res = await fetch('/cars');
      if (!res.ok) throw new Error('Error fetching cars');
      const cars = await res.json();
      carList.innerHTML = '';
      if (cars.length === 0) {
        carList.innerHTML = '<li>No hay autos disponibles</li>';
        return;
      }
      cars.forEach((car) => {
        const li = document.createElement('li');
        li.textContent = ` ${car.id} ${car.brand} ${car.model} (${car.year}) - $${car.price}`;
        carList.appendChild(li);
      });
    } catch (error) {
      showMessage('Error cargando lista de autos. Intenta más tarde.', 'error');
    }
  };


  carForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('id').value.trim();
    const brand = document.getElementById('brand').value.trim();
    const model = document.getElementById('model').value.trim();
    const year = document.getElementById('year').value.trim();
    const price = document.getElementById('price').value.trim();

    if (!id || !brand || !model || !year || !price) {
      showMessage('Todos los campos son requeridos', 'error');
      return;
    }
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      showMessage('Año inválido. Por favor, ingrese un año válido.', 'error');
      return;
    }
    if (isNaN(price) || price < 0) {
      showMessage('Precio inválido. Por favor, ingrese un precio válido.', 'error');
      return;
    }

    try {
      const res = await fetch('/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, brand, model, year, price }),
      });
      if (!res.ok) throw new Error('Fallo al añadir/actualizar el auto');
      showMessage('Auto añadido/actualizado exitosamente!', 'success');
      carForm.reset();
      fetchCars();
    } catch (error) {
      showMessage('Error añadiendo/actualizando el auto. Por favor, intenta de nuevo.', 'error');
    }
  });


  deleteCarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('deleteId').value.trim();

    if (!id) {
      showMessage('ID es requerido', 'error');
      return;
    }

    try {
      const res = await fetch(`/cars/${id}`, { method: 'DELETE' });
      if (res.status === 404) {
        showMessage('Auto no encontrado', 'error');
        return;
      }
      if (!res.ok) throw new Error('Error eliminando auto');
      showMessage('Auto eliminado exitosamente!', 'success');
      deleteCarForm.reset();
      fetchCars();
    } catch (error) {
      showMessage('Error eliminando el auto. Por favor, intenta de nuevo.', 'error');
    }
  });

  findCarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('findId').value.trim();

    if (!id) {
      showMessage('ID es requerido', 'error');
      return;
    }

    try {
      const res = await fetch(`/cars/${id}`);
      if (res.status === 404) {
        showMessage('Auto no encontrado', 'error');
        return;
      }
      if (!res.ok) throw new Error('Error buscando auto.');

      const car = await res.json();
      foundCarDetails.textContent = `ID: ${car.id}, Marca: ${car.brand}, Modelo: ${car.model}, Año: ${car.year}, Precio: $${car.price}`;
      foundCarDetails.style.display = 'block';
    } catch (error) {
      showMessage('Error buscando auto. Intenta de nuevo.', 'error');
    }
  });

  fetchCars();
});
