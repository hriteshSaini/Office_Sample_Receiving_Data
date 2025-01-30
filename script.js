document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('qr-video');
    const scanButton = document.getElementById('scan-button');
    const sendWhatsAppButton = document.getElementById('send-whatsapp');
    const qrTableBody = document.querySelector('#qr-table tbody');
    const deliveryPersonDropdown = document.getElementById('delivery-person');
    let scanning = false;
    let scanCount = 0;
    let scannedData = [];
  
    // Function to start scanning
    scanButton.addEventListener('click', () => {
      if (!scanning) {
        startScanning();
        scanButton.textContent = 'Stop Scanning';
      } else {
        stopScanning();
        scanButton.textContent = 'Start Scanning';
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
  
    // Function to send data via WhatsApp
    sendWhatsAppButton.addEventListener('click', () => {
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
        `Scanned QR Codes:\n${scannedData.join('\n')}`
      );
  
      // Open WhatsApp with the pre-filled message
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    });
  });


