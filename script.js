document.getElementById('next').addEventListener('click', () => {
    const container = document.getElementById('rows-container');
    const newRow = document.createElement('div');
    newRow.className = 'row';
    newRow.innerHTML = `
        <div class="col-sm-3 mb-3">
            <label class="form-label">Quantity</label>
            <input type="text" name="quantity" class="form-control" placeholder="e.g, quantity.No" />
        </div>
        <div class="col-sm-3 mb-3">
            <label class="form-label">Price</label>
            <input type="text" name="price" class="form-control" placeholder="e.g, Rupees" />
        </div>
    `;
    container.appendChild(newRow);
});

document.getElementById('submit').addEventListener('click', async () => {
    const rows = document.querySelectorAll('#rows-container .row');
    const data = Array.from(rows).map(row => {
        const quantity = row.querySelector('input[name="quantity"]').value;
        const price = row.querySelector('input[name="price"]').value;
        return { quantity, price };
    });

    try {
        const response = await fetch('/api/saveData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (response.ok) {
            alert('Data saved successfully!');
        } else {
            alert('Failed to save data: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while saving data.');
    }
});