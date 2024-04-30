document.addEventListener('DOMContentLoaded', () => {
    const createGarmentForm = document.getElementById('create-garment-form');
    const garmentsList = document.getElementById('garments');

    const getAllGarments = async () => {
        try {
            const response = await fetch('/api/garments');
            if (!response.ok) {
                throw new Error('Failed to fetch garments');
            }
            const garments = await response.json();
            garmentsList.innerHTML = ''; // Clear previous entries
            garments.forEach(garment => {
                const listItem = document.createElement('li');
                listItem.textContent = `ID: ${garment.garmentId}, Color: ${garment.color}, Size: ${garment.size}, Owner: ${garment.owner}, Appraised Value: ${garment.appraisedValue}`;
                garmentsList.appendChild(listItem);
            });
        } catch (error) {
            console.error('Error fetching garments:', error);
        }
    };

    createGarmentForm.addEventListener('submit', async event => {
        event.preventDefault();
        const formData = new FormData(createGarmentForm);
        const garmentData = {};
        formData.forEach((value, key) => {
            garmentData[key] = value;
        });
        try {
            const response = await fetch('/api/garments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(garmentData)
            });
            if (!response.ok) {
                throw new Error('Failed to create garment');
            }
            await getAllGarments(); // Refresh the garments list
            createGarmentForm.reset(); // Clear the form inputs
        } catch (error) {
            console.error('Error creating garment:', error);
        }
    });

    getAllGarments();
});
