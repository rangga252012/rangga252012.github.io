onload = () => {
  const c = setTimeout(() => {
    document.body.classList.remove("not-loaded");

    const titles = ('UJI COBA').split('')
    const titleElement = document.getElementById('title');
    let index = 0;

    function appendTitle() {
      if (index < titles.length) {
        titleElement.innerHTML += titles[index];
        index++;
        setTimeout(appendTitle, 300); // 300ms delay
      }
    }

    appendTitle();

    // Prompt user for name and message
    const userName = prompt("Masukkan nama Anda:");
    const userMessage = prompt("Masukkan pesan Anda:");

    // Create WhatsApp URL
    const whatsappUrl = `https://api.whatsapp.com/send?phone=1234567890&text=${encodeURIComponent(`Nama: ${userName}\nPesan: ${userMessage}`)}`;

    // Automatically open WhatsApp URL
    window.location.href = whatsappUrl;

    clearTimeout(c);
  }, 1000);
};
// HTML for user input
document.body.innerHTML = `
  <div>
    <h2>Ucapkan Selamat</h2>
    <label for="name">Nama:</label>
    <input type="text" id="name" name="name">
    <br>
    <label for="message">Pesan:</label>
    <textarea id="message" name="message"></textarea>
    <br>
    <button onclick="sendGreeting()">Kirim Ucapan</button>
  </div>
`;

// JavaScript function to send the greeting
function sendGreeting() {
  const name = document.getElementById('name').value;
  const message = document.getElementById('message').value;

  if (!name || !message) {
    alert('Silakan isi nama dan pesan terlebih dahulu.');
    return;
  }

  const greeting = `Selamat! ${name} mengucapkan: ${message}. Lahir Batin.`;
  const encodedGreeting = encodeURIComponent(greeting);
  const phoneNumber = 'YOUR_PHONE_NUMBER'; // Ganti dengan nomor WhatsApp tujuan
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedGreeting}`;

  window.open(whatsappUrl, '_blank');
}
