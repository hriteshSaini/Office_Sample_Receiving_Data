document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('qr-video');
  const scanButton = document.getElementById('scan-button');
  const sendWhatsAppButton = document.getElementById('send-whatsapp');
  const qrTableBody = document.querySelector('#qr-table tbody');
  const deliveryPersonDropdown = document.getElementById('delivery-person');
  const successSound = new Audio('success.mp3');
  let scanning = false;
  let scanCount = 0;
  let scannedData = [];

  // Google Apps Script URL (replace with your deployed web app URL)
  const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxAgrPeenF7HDk0SKLe_z5f7zubd2Jttcc0HXFgTWCRWJ6EIJgJp2AzqkbNzeS_YpHKWg/exec';

  // Function to start scanning
  scanButton.addEventListener('click', () => {
    if (!scanning) {
      startScanning();
      scanButton.textContent = 'Stop Scanning Samples';
    } else {
      stopScanning();
      scanButton.textContent = 'Start Scanning Samples';
    }
    scanning = !scanning;
  });

  // Function to start the camera and scan QR codes
  function startScanning() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        video.srcObject = stream;
        video.play();
        requestAnimationFrame(scanQR);
      })
      .catch(err => {
        console.error('Error accessing the camera: ', err);
        alert('Error accessing the camera. Please ensure you have granted camera permissions.');
      });
  }

  // Function to stop the camera
  function stopScanning() {
    const stream = video.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  }

  // Function to scan QR codes
  function scanQR() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        addQRToTable(code.data);
        successSound.play(); // Play success sound
        stopScanning(); // Stop scanning after detecting a QR code
        scanButton.textContent = 'Start Scanning';
        scanning = false;
      }
    }
    if (scanning) {
      requestAnimationFrame(scanQR);
    }
  }

  // Function to add scanned QR code data to the table
  function addQRToTable(data) {
    scanCount++;
    scannedData.push(data.split("=")[1]); // Store data for WhatsApp
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${scanCount}</td>
      <td>${data.split("=")[1]}</td>
    `;
    qrTableBody.appendChild(row);
  }

  // Function to send data to Google Sheet
  function sendToGoogleSheet() {
    const deliveryPerson = deliveryPersonDropdown.value;
    const today = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // Prepare data to send to Google Sheet
    const payload = {
      date: today,
      deliveryPerson: deliveryPerson,
      qrCodes: scannedData, // Send all scanned QR codes
    };
    console.log(payload);
    fetch(googleScriptUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then(response => response.text())
      .then(result => {
        console.log('Data sent to Google Sheet:', result);
        // Open WhatsApp after successfully updating the Google Sheet
        openWhatsApp();
      })
      .catch(error => {
        console.error('Error sending data to Google Sheet:', error);
      });
  }

  // Function to open WhatsApp
  function openWhatsApp() {
    overlay.classList.add('hidden');
    sendWhatsAppButton.disabled = false;
    const phoneNumber = '+918504971728'; // Replace with the recipient's phone number
    const deliveryPerson = deliveryPersonDropdown.value;

    // Get today's date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // Construct the WhatsApp message
    const message = encodeURIComponent(
      `QR Samples Delivered Today - ${formattedDate}\n\n` +
      `Delivery Person: ${deliveryPerson}\n\n` +
      `Scanned QR Codes:\n${scannedData.map((data, index) => `${index + 1}. ${data}`).join('\n')}`
    );

    // Open WhatsApp with the pre-filled message
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  // Function to handle "Send via WhatsApp" button click
  sendWhatsAppButton.addEventListener('click', () => {
    if (scannedData.length === 0) {
      alert('No QR codes scanned yet!');
      return;
    }

    // Show the overlay and spinner
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('hidden');

    // Disable the button to prevent multiple clicks
    sendWhatsAppButton.disabled = true;

    // Send data to Google Sheet first
    sendToGoogleSheet()
      .then(() => {
        openWhatsApp();
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
      })
      .finally(() => {
        // Ensure spinner is hidden in case of error
        overlay.classList.add('hidden');
        sendWhatsAppButton.disabled = false;
      });
  });
});

