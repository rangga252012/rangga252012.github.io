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
